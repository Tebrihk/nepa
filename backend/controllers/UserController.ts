import { Request, Response } from 'express';
import { PrismaClient, UserStatus, UserRole } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { invalidateUserCache } from '../middleware/cache';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(100).trim().optional(),
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim().optional(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: Joi.string().uri().optional(),
  bio: Joi.string().max(500).trim().optional(),
  location: Joi.string().max(100).trim().optional(),
  website: Joi.string().uri().optional()
});

const updatePreferencesSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  location: Joi.string().max(100).optional(),
  website: Joi.string().uri().optional(),
  timezone: Joi.string().optional(),
  language: Joi.string().optional(),
  currency: Joi.string().optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  layout: Joi.string().valid('compact', 'comfortable', 'spacious').optional(),
  sidebarCollapsed: Joi.boolean().optional(),
  notificationsEnabled: Joi.boolean().optional(),
  autoSave: Joi.boolean().optional(),
  preferences: Joi.object().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(12)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'string.min': 'Password must be at least 12 characters long',
      'string.max': 'Password must not exceed 128 characters'
    })
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRole)).required(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional()
});

const searchSchema = Joi.object({
  search: Joi.string().max(100).trim().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'lastLoginAt', 'name', 'email').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  isEmailVerified: Joi.boolean().optional(),
  isPhoneVerified: Joi.boolean().optional(),
  twoFactorEnabled: Joi.boolean().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user;

      // Admin authorization check
      if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'ADMIN_REQUIRED'
        });
      }

      const { error, value } = searchSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const {
        page,
        limit,
        search,
        role,
        status,
        sortBy,
        sortOrder,
        isEmailVerified,
        isPhoneVerified,
        twoFactorEnabled,
        dateFrom,
        dateTo
      } = value;

      const skip = (page - 1) * limit;

      // Build where clause with sanitization
      const where: any = {};

      if (search) {
        const sanitizedSearch = DOMPurify.sanitize(search.trim());
        where.OR = [
          { email: { contains: sanitizedSearch, mode: 'insensitive' } },
          { username: { contains: sanitizedSearch, mode: 'insensitive' } },
          { name: { contains: sanitizedSearch, mode: 'insensitive' } }
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      if (isEmailVerified !== undefined) {
        where.isEmailVerified = isEmailVerified;
      }

      if (isPhoneVerified !== undefined) {
        where.isPhoneVerified = isPhoneVerified;
      }

      if (twoFactorEnabled !== undefined) {
        where.twoFactorEnabled = twoFactorEnabled;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }
        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      // Non-super admins can only see users with equal or lower roles
      if (currentUser.role === UserRole.ADMIN) {
        where.role = {
          in: [UserRole.USER, UserRole.ADMIN]
        };
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            status: true,
            walletAddress: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            twoFactorEnabled: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                bills: true,
                payments: true,
                sessions: true,
                auditLogs: currentUser.role === UserRole.SUPER_ADMIN
              }
            }
          },
          orderBy
        }),
        prisma.user.count({ where })
      ]);

      // Log admin action for audit
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USERS_LIST_VIEWED',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: {
            filters: { search, role, status, isEmailVerified, isPhoneVerified, twoFactorEnabled, dateFrom, dateTo },
            pagination: { page, limit },
            resultsCount: users.length,
            totalResults: total
          }
        }
      });

      res.json({
        message: 'Users retrieved successfully',
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        },
        filters: {
          search,
          role,
          status,
          sortBy,
          sortOrder,
          isEmailVerified,
          isPhoneVerified,
          twoFactorEnabled,
          dateFrom,
          dateTo
        },
        statistics: {
          totalUsers: total,
          activeUsers: users.filter(u => u.status === 'ACTIVE').length,
          inactiveUsers: users.filter(u => u.status === 'INACTIVE').length,
          suspendedUsers: users.filter(u => u.status === 'SUSPENDED').length,
          verifiedUsers: users.filter(u => u.isEmailVerified).length,
          twoFactorUsers: users.filter(u => u.twoFactorEnabled).length,
          roleDistribution: {
            users: users.filter(u => u.role === UserRole.USER).length,
            admins: users.filter(u => u.role === UserRole.ADMIN).length,
            superAdmins: users.filter(u => u.role === UserRole.SUPER_ADMIN).length
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);

      // Log error for security monitoring
      try {
        await prisma.auditLog.create({
          data: {
            userId: (req as any).user?.id,
            action: 'USERS_LIST_ERROR',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            details: { error: error.message }
          }
        });
      } catch (logError) {
        console.error('Failed to log users list error:', logError);
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve users'
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phoneNumber: true,
          avatar: true,
          role: true,
          status: true,
          walletAddress: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          twoFactorEnabled: true,
          twoFactorMethod: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          _count: {
            select: {
              bills: true,
              payments: true,
              sessions: true,
              auditLogs: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const user = (req as any).user;
      const updateData: any = {};

      // Sanitize and validate each field
      if (value.name !== undefined) {
        updateData.name = DOMPurify.sanitize(validator.escape(value.name.trim()));
      }

      if (value.username !== undefined) {
        const sanitizedUsername = DOMPurify.sanitize(value.username.toLowerCase().trim());

        // Check if username is already taken
        const existingUser = await prisma.user.findFirst({
          where: {
            username: sanitizedUsername,
            id: { not: user.id }
          }
        });

        if (existingUser) {
          return res.status(400).json({
            error: 'Username already taken',
            field: 'username'
          });
        }

        // Check for restricted usernames
        const restrictedUsernames = ['admin', 'root', 'system', 'api', 'www', 'mail', 'support', 'help'];
        if (restrictedUsernames.includes(sanitizedUsername)) {
          return res.status(400).json({
            error: 'Username is restricted',
            field: 'username'
          });
        }

        updateData.username = sanitizedUsername;
      }

      if (value.phoneNumber !== undefined) {
        const sanitizedPhone = DOMPurify.sanitize(value.phoneNumber.trim());

        // Validate phone number format more thoroughly
        if (!validator.isMobilePhone(sanitizedPhone, 'any', { strictMode: true })) {
          return res.status(400).json({
            error: 'Invalid phone number format',
            field: 'phoneNumber'
          });
        }

        // Check if phone number is already taken
        const existingPhone = await prisma.user.findFirst({
          where: {
            phoneNumber: sanitizedPhone,
            id: { not: user.id }
          }
        });

        if (existingPhone) {
          return res.status(400).json({
            error: 'Phone number already registered',
            field: 'phoneNumber'
          });
        }

        updateData.phoneNumber = sanitizedPhone;
      }

      if (value.avatar !== undefined) {
        // Validate avatar URL
        if (!validator.isURL(value.avatar, {
          protocols: ['http', 'https'],
          require_protocol: true
        })) {
          return res.status(400).json({
            error: 'Invalid avatar URL',
            field: 'avatar'
          });
        }
        updateData.avatar = DOMPurify.sanitize(value.avatar.trim());
      }

      if (value.bio !== undefined) {
        updateData.bio = DOMPurify.sanitize(value.bio.trim());
      }

      if (value.location !== undefined) {
        updateData.location = DOMPurify.sanitize(validator.escape(value.location.trim()));
      }

      if (value.website !== undefined) {
        if (!validator.isURL(value.website, {
          protocols: ['http', 'https'],
          require_protocol: true
        })) {
          return res.status(400).json({
            error: 'Invalid website URL',
            field: 'website'
          });
        }
        updateData.website = DOMPurify.sanitize(value.website.trim());
      }

      // Only update if there are actual changes
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phoneNumber: true,
          avatar: true,
          bio: true,
          location: true,
          website: true,
          updatedAt: true
        }
      });

      // Invalidate user cache after profile update
      await invalidateUserCache(user.id);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);

      // Handle specific database errors
      if (error.code === 'P2002') {
        return res.status(400).json({
          error: 'Unique constraint violation',
          details: 'Username, email, or phone number already exists'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile'
      });
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const { error, value } = updatePreferencesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const user = (req as any).user;

      // Sanitize all preference fields
      const sanitizedData: any = {};

      if (value.bio !== undefined) {
        sanitizedData.bio = DOMPurify.sanitize(value.bio.trim());
      }

      if (value.location !== undefined) {
        sanitizedData.location = DOMPurify.sanitize(validator.escape(value.location.trim()));
      }

      if (value.website !== undefined) {
        if (value.website && !validator.isURL(value.website, {
          protocols: ['http', 'https'],
          require_protocol: true
        })) {
          return res.status(400).json({
            error: 'Invalid website URL',
            field: 'website'
          });
        }
        sanitizedData.website = DOMPurify.sanitize(value.website.trim());
      }

      if (value.timezone !== undefined) {
        sanitizedData.timezone = DOMPurify.sanitize(value.timezone.trim());
      }

      if (value.language !== undefined) {
        sanitizedData.language = DOMPurify.sanitize(value.language.trim());
      }

      if (value.currency !== undefined) {
        sanitizedData.currency = DOMPurify.sanitize(value.currency.trim().toUpperCase());
      }

      if (value.theme !== undefined) {
        sanitizedData.theme = value.theme;
      }

      if (value.layout !== undefined) {
        sanitizedData.layout = value.layout;
      }

      if (value.sidebarCollapsed !== undefined) {
        sanitizedData.sidebarCollapsed = value.sidebarCollapsed;
      }

      if (value.notificationsEnabled !== undefined) {
        sanitizedData.notificationsEnabled = value.notificationsEnabled;
      }

      if (value.autoSave !== undefined) {
        sanitizedData.autoSave = value.autoSave;
      }

      if (value.preferences !== undefined) {
        sanitizedData.preferences = typeof value.preferences === 'object'
          ? JSON.parse(JSON.stringify(value.preferences)) // Deep clone and sanitize
          : value.preferences;
      }

      const updatedProfile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: sanitizedData,
        create: {
          userId: user.id,
          ...sanitizedData
        }
      });

      // Invalidate user cache after preferences update
      await invalidateUserCache(user.id);

      res.json({
        message: 'Preferences updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update preferences'
      });
    }
  }

  async getPreferences(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const profile = await prisma.userProfile.findUnique({
        where: { userId: user.id }
      });

      res.json({ profile });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const user = (req as any).user;

      // Rate limiting check - prevent too frequent password changes
      const recentPasswordChange = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'PASSWORD_CHANGE',
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          }
        }
      });

      if (recentPasswordChange) {
        return res.status(429).json({
          error: 'Password change rate limit exceeded',
          message: 'Please wait 15 minutes before attempting another password change',
          retryAfter: Math.ceil((recentPasswordChange.createdAt.getTime() + 15 * 60 * 1000 - Date.now()) / 1000)
        });
      }

      // Get current user with password hash and security info
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          passwordHash: true,
          lastPasswordChange: true,
          twoFactorEnabled: true
        }
      });

      if (!currentUser?.passwordHash) {
        return res.status(400).json({
          error: 'No password set for this account',
          code: 'NO_PASSWORD'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(value.currentPassword, currentUser.passwordHash);
      if (!isValidPassword) {
        // Log failed password change attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PASSWORD_CHANGE_FAILED',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            details: { reason: 'Invalid current password' }
          }
        });

        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Check if new password is same as current password
      const isSamePassword = await bcrypt.compare(value.newPassword, currentUser.passwordHash);
      if (isSamePassword) {
        return res.status(400).json({
          error: 'New password must be different from current password',
          code: 'SAME_PASSWORD'
        });
      }

      // Check password against common passwords and breached passwords (simplified check)
      const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
      const newPasswordLower = value.newPassword.toLowerCase();
      if (commonPasswords.some(common => newPasswordLower.includes(common))) {
        return res.status(400).json({
          error: 'Password is too common or weak',
          code: 'WEAK_PASSWORD'
        });
      }

      // Hash new password with higher salt rounds for security
      const newPasswordHash = await bcrypt.hash(value.newPassword, 14);

      // Update password and last password change timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          lastPasswordChange: new Date(),
          requiresPasswordChange: false
        }
      });

      // Log successful password change
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_CHANGE',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: { success: true }
        }
      });

      // Invalidate all user sessions except current one
      await prisma.userSession.updateMany({
        where: {
          userId: user.id,
          id: { not: (req as any).sessionId }
        },
        data: { isActive: false }
      });

      // Invalidate user cache after password change
      await invalidateUserCache(user.id);

      res.json({
        message: 'Password changed successfully',
        details: {
          timestamp: new Date().toISOString(),
          allSessionsRevoked: true,
          securityNote: 'All other sessions have been revoked for security'
        }
      });
    } catch (error) {
      console.error('Change password error:', error);

      // Log error for security monitoring
      try {
        await prisma.auditLog.create({
          data: {
            userId: (req as any).user?.id,
            action: 'PASSWORD_CHANGE_ERROR',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            details: { error: error.message }
          }
        });
      } catch (logError) {
        console.error('Failed to log password change error:', logError);
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to change password'
      });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = updateUserRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const currentUser = (req as any).user;
      const targetUserId = id;

      // Comprehensive permission checks
      if (currentUser.role === UserRole.USER) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'ADMIN_REQUIRED',
          message: 'Only administrators can update user roles'
        });
      }

      // Get target user for validation
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          username: true
        }
      });

      if (!targetUser) {
        return res.status(404).json({
          error: 'Target user not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prevent role escalation based on current user role
      if (currentUser.role === UserRole.ADMIN) {
        // Admins can only manage USER roles and other ADMINs (not SUPER_ADMIN)
        if (value.role === UserRole.SUPER_ADMIN) {
          return res.status(403).json({
            error: 'Cannot promote to Super Admin',
            code: 'ROLE_ESCALATION_DENIED',
            message: 'Only Super Admins can assign Super Admin role'
          });
        }

        // Admins cannot demote other admins or super admins
        if ((targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) &&
          targetUser.id !== currentUser.id) {
          return res.status(403).json({
            error: 'Cannot modify other administrators',
            code: 'ADMIN_MODIFICATION_DENIED'
          });
        }
      }

      // Prevent self-modification restrictions for certain role changes
      if (targetUserId === currentUser.id) {
        // Users can change some aspects of their own profile, but not role escalation
        if (value.role !== currentUser.role) {
          return res.status(403).json({
            error: 'Cannot modify own role',
            code: 'SELF_MODIFICATION_DENIED',
            message: 'Contact an administrator for role changes'
          });
        }
      }

      // Additional validation for status changes
      if (value.status) {
        const validStatusTransitions = {
          [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
          [UserStatus.INACTIVE]: [UserStatus.ACTIVE],
          [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE]
        };

        if (targetUser.status !== value.status &&
          !validStatusTransitions[targetUser.status]?.includes(value.status)) {
          return res.status(400).json({
            error: 'Invalid status transition',
            code: 'INVALID_STATUS_TRANSITION',
            details: {
              from: targetUser.status,
              to: value.status,
              allowed: validStatusTransitions[targetUser.status]
            }
          });
        }
      }

      // Create audit log entry before making changes
      const auditData = {
        userId: currentUser.id,
        action: 'ROLE_UPDATE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
          targetUserId,
          oldRole: targetUser.role,
          newRole: value.role,
          oldStatus: targetUser.status,
          newStatus: value.status,
          timestamp: new Date().toISOString()
        }
      };

      // Perform the update
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          role: value.role,
          ...(value.status && { status: value.status })
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          status: true,
          updatedAt: true
        }
      });

      // Log the successful role update
      await prisma.auditLog.create({
        data: {
          ...auditData,
          success: true
        }
      });

      // Invalidate cache for the updated user
      await invalidateUserCache(targetUserId);

      // If role was changed, invalidate all sessions for security
      if (value.role !== targetUser.role) {
        await prisma.userSession.updateMany({
          where: { userId: targetUserId },
          data: { isActive: false }
        });
      }

      res.json({
        message: 'User role updated successfully',
        user: updatedUser,
        audit: {
          action: 'ROLE_UPDATE',
          performedBy: currentUser.username,
          timestamp: new Date().toISOString(),
          sessionsRevoked: value.role !== targetUser.role
        }
      });
    } catch (error) {
      console.error('Update user role error:', error);

      // Log error for security monitoring
      try {
        await prisma.auditLog.create({
          data: {
            userId: (req as any).user?.id,
            action: 'ROLE_UPDATE_ERROR',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            details: {
              error: error.message,
              targetUserId: req.params.id,
              requestBody: req.body
            }
          }
        });
      } catch (logError) {
        console.error('Failed to log role update error:', logError);
      }

      // Handle specific database errors
      if (error.code === 'P2025') {
        return res.status(400).json({
          error: 'Record not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update user role'
      });
    }
  }

  async getUserSessions(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user || !user.id) {
        return res.status(401).json({
          error: 'User authentication required'
        });
      }

      const sessions = await prisma.userSession.findMany({
        where: {
          userId: user.id,
          isActive: true
        },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
          lastAccessAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Sanitize session data for response
      const sanitizedSessions = sessions.map(session => ({
        ...session,
        userAgent: DOMPurify.sanitize(session.userAgent || ''),
        ipAddress: DOMPurify.sanitize(session.ipAddress || '')
      }));

      res.json({
        message: 'Sessions retrieved successfully',
        sessions: sanitizedSessions,
        count: sanitizedSessions.length
      });
    } catch (error) {
      console.error('Get user sessions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve user sessions'
      });
    }
  }

  async revokeSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const user = (req as any).user;

      // Validate session ID format
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({
          error: 'Invalid session ID',
          code: 'INVALID_SESSION_ID'
        });
      }

      // Sanitize session ID
      const sanitizedSessionId = DOMPurify.sanitize(sessionId.trim());

      const session = await prisma.userSession.findFirst({
        where: {
          id: sanitizedSessionId,
          userId: user.id
        }
      });

      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Log session revocation for audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SESSION_REVOKED',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: {
            sessionId: sanitizedSessionId,
            sessionCreatedAt: session.createdAt,
            revokedAt: new Date().toISOString()
          }
        }
      });

      await prisma.userSession.update({
        where: { id: sanitizedSessionId },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: user.id
        }
      });

      // Invalidate user cache after session revocation
      await invalidateUserCache(user.id);

      res.json({
        message: 'Session revoked successfully',
        sessionId: sanitizedSessionId,
        revokedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to revoke session'
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      // Users can only delete themselves, admins can delete other users, super admins can delete anyone
      if (currentUser.role === UserRole.USER && currentUser.id !== id) {
        return res.status(403).json({ error: 'Cannot delete other users' });
      }

      if (currentUser.role === UserRole.ADMIN && currentUser.id !== id) {
        const targetUser = await prisma.user.findUnique({
          where: { id },
          select: { role: true }
        });

        if (targetUser?.role === UserRole.ADMIN || targetUser?.role === UserRole.SUPER_ADMIN) {
          return res.status(403).json({ error: 'Cannot delete admin users' });
        }
      }

      // Soft delete by setting status to INACTIVE
      await prisma.user.update({
        where: { id },
        data: {
          status: UserStatus.INACTIVE,
          email: `deleted_${Date.now()}_${id}`,
          username: null,
          walletAddress: null
        }
      });

      // Deactivate all sessions
      await prisma.userSession.updateMany({
        where: { userId: id },
        data: { isActive: false }
      });

      // Invalidate cache for the deleted user
      await invalidateUserCache(id);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
