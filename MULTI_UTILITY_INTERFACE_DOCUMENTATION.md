# Multi-Utility Support Interface Documentation

## Overview

The NEPA platform now supports multiple utility types (electricity, water, gas, internet) with specialized interfaces for each utility type. This comprehensive system provides users with a unified experience while maintaining utility-specific functionality and branding.

## Architecture

### Component Structure
```
src/components/utility/
├── UtilityTypeSelector.tsx      # Utility type selection component
├── UtilityFormFields.tsx        # Utility-specific form fields
├── UtilityPaymentFlow.tsx       # Utility-specific payment flows
├── UtilitySwitcher.tsx          # Account switching functionality
├── UtilityPreferences.tsx        # Preference management
└── index.ts                    # Component exports
```

### Core Features
- **Multi-Utility Support**: Electricity, Water, Gas, Internet
- **Utility-Specific Forms**: Dynamic forms based on utility type
- **Branded Interfaces**: Unique colors, icons, and styling per utility
- **Specialized Payment Flows**: Tailored payment processes
- **Account Switching**: Seamless switching between utility accounts
- **Preference Management**: Comprehensive settings per utility type

## Components

### 1. UtilityTypeSelector

**Purpose**: Allow users to select and switch between different utility types.

**Features**:
- Multiple display modes (grid, list, dropdown)
- Utility-specific icons and branding
- Popular/utility status badges
- Feature descriptions per utility
- Responsive design

**Props**:
```typescript
interface UtilityTypeSelectorProps {
  selectedUtility?: UtilityType;
  onUtilitySelect: (utility: UtilityType) => void;
  disabled?: boolean;
  showFeatures?: boolean;
  variant?: 'grid' | 'list' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Usage**:
```typescript
<UtilityTypeSelector
  selectedUtility={selectedUtility}
  onUtilitySelect={handleUtilitySelect}
  variant="grid"
  showFeatures={true}
/>
```

### 2. UtilityFormFields

**Purpose**: Render dynamic form fields based on selected utility type.

**Features**:
- Common fields for all utilities
- Utility-specific fields (meter numbers, tariffs, etc.)
- Real-time validation
- Error handling
- Accessibility support

**Supported Utility Types**:

#### Electricity
- Meter Number
- Tariff Class (Residential, Commercial, Industrial, Agricultural)
- Connection Type (Single/Three Phase, Prepaid/Postpaid)
- Average Monthly Usage (kWh)

#### Water
- Water Meter Number
- Connection Size
- Property Type
- Average Monthly Consumption (gallons)

#### Gas
- Gas Meter Number
- Gas Connection Type (Natural Gas, LPG, CNG, Biogas)
- Number of Gas Appliances
- Average Gas Consumption (therms)

#### Internet
- Service Plan (Basic, Standard, Premium, Enterprise)
- Connection Speed (10Mbps - 1Gbps)
- Data Cap (Unlimited, 100GB - 2TB)
- Contract Type (Month-to-Month, 1-3 Year)

**Usage**:
```typescript
<UtilityFormFields
  utilityType={utilityType}
  formData={formData}
  onChange={handleFormChange}
  errors={formErrors}
  showValidation={true}
/>
```

### 3. UtilityPaymentFlow

**Purpose**: Provide utility-specific payment processes and flows.

**Features**:
- Multi-step payment process
- Payment method selection
- Utility-specific payment options
- Fee calculation
- Real-time processing

**Payment Methods**:
- Credit/Debit Card (2.5% fee)
- Bank Transfer (1% fee)
- Mobile Money (1.5% fee)
- Cryptocurrency (0.5% fee)

**Utility-Specific Flows**:

#### Electricity
- **Instant Payment**: Immediate bill payment
- **Scheduled Payment**: Future-dated payments
- **Prepaid Recharge**: Meter token purchase
- **Postpaid Bill Payment**: Monthly bill settlement

#### Water
- **Water Bill Payment**: Monthly water bill payment
- Usage analytics and leak detection alerts

#### Gas
- **Gas Refill**: Cylinder ordering and payment
- Home delivery options
- Safety certified providers

#### Internet
- **Data Bundle Recharge**: Instant data top-up
- Multiple plan options
- Data rollover support

**Usage**:
```typescript
<UtilityPaymentFlow
  utilityType={utilityType}
  bill={selectedBill}
  onPaymentComplete={handlePaymentComplete}
  onPaymentError={handlePaymentError}
/>
```

### 4. UtilitySwitcher

**Purpose**: Manage and switch between multiple utility accounts.

**Features**:
- Multiple view modes (grid, list, carousel)
- Account status indicators
- Primary account designation
- Auto-pay management
- Account details expansion
- Quick actions (set primary, toggle auto-pay)

**Account Management**:
- Add new utility accounts
- Remove existing accounts
- Update account information
- Set primary account
- Enable/disable auto-pay

**Usage**:
```typescript
<UtilitySwitcher
  accounts={utilityAccounts}
  onAccountSelect={handleAccountSelect}
  onAccountAdd={handleAccountAdd}
  onAccountRemove={handleAccountRemove}
  selectedAccountId={selectedAccountId}
  showStats={true}
/>
```

### 5. UtilityPreferences

**Purpose**: Comprehensive preference management for all utility types.

**Features**:
- General settings (language, timezone, currency)
- Notification preferences (email, SMS, push)
- Payment settings (auto-pay, reminders)
- Security settings (2FA, biometrics)
- Display preferences (theme, layout)
- Utility-specific settings

**Preference Categories**:

#### General Preferences
- Default utility type
- Language selection
- Timezone configuration
- Currency preference
- Date format

#### Notification Preferences
- Channel selection (email, SMS, push)
- Notification types (bills, payments, usage, outages)
- Promotional offers

#### Payment Preferences
- Default payment method
- Auto-pay configuration
- Payment reminders
- Low balance alerts

#### Security Preferences
- Two-factor authentication
- Biometric authentication
- Session timeout
- Payment limits
- PIN requirements

#### Display Preferences
- Theme selection (light, dark, auto)
- Layout preferences
- Graph and chart visibility
- Default view mode

#### Utility-Specific Preferences
Each utility type has customized settings:

**Electricity**
- High usage alerts
- Unusual usage detection
- Rate change notifications
- Maintenance schedules
- Smart scheduling
- Budget tracking

**Water**
- Leak detection alerts
- Consumption analytics
- Usage trends
- Conservation tips

**Gas**
- Safety alerts
- Usage monitoring
- Delivery schedules
- Appliance efficiency

**Internet**
- Data usage alerts
- Speed monitoring
- Plan optimization
- Outage notifications

**Usage**:
```typescript
<UtilityPreferences
  preferences={userPreferences}
  onPreferencesChange={handlePreferencesChange}
  onSave={handleSavePreferences}
  onReset={handleResetPreferences}
/>
```

## Utility Branding

### Color Schemes
- **Electricity**: Yellow theme (#F59E0B, #FEF3C7)
- **Water**: Blue theme (#3B82F6, #EFF6FF)
- **Gas**: Orange theme (#F97316, #FED7AA)
- **Internet**: Purple theme (#9333EA, #F3E8FF)

### Icons
- **Electricity**: Zap icon (lightning bolt)
- **Water**: Droplets icon
- **Gas**: Flame icon
- **Internet**: Wifi icon

### Typography
- Consistent font family across utilities
- Utility-specific accent colors
- Clear hierarchy and readability

## Responsive Design

### Mobile (< 768px)
- Single column layouts
- Touch-friendly controls
- Collapsible sections
- Swipe gestures for carousel

### Tablet (768px - 1024px)
- Two-column layouts where appropriate
- Optimized touch targets
- Simplified navigation

### Desktop (> 1024px)
- Full multi-column layouts
- Hover states and tooltips
- Keyboard navigation support
- Advanced features enabled

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

### Features
- Skip navigation links
- Focus indicators
- Error announcements
- Progress indicators
- Alternative text for icons

## State Management

### Data Flow
```
User Selection → Component State → Parent Callback → Global State
```

### Local State
- Form field values
- Validation states
- UI interaction states
- Expanded/collapsed sections

### Global State
- User preferences
- Account information
- Authentication status
- Application settings

## Performance Optimization

### Code Splitting
- Lazy loading of utility-specific components
- Dynamic imports for large datasets
- Route-based code splitting

### Rendering Optimization
- React.memo for pure components
- useMemo for expensive calculations
- useCallback for event handlers
- Virtual scrolling for large lists

### Bundle Optimization
- Tree shaking for unused code
- Image optimization
- Font loading optimization
- Service worker caching

## Testing

### Unit Tests
- Component rendering
- User interactions
- Form validation
- State changes

### Integration Tests
- Component integration
- Data flow testing
- API integration
- Error handling

### E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility testing

## Internationalization

### Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)

### Localization Features
- Date/time formatting
- Currency formatting
- Number formatting
- RTL language support
- Cultural adaptations

## Security Considerations

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Data encryption

### Payment Security
- PCI DSS compliance
- Tokenization
- Fraud detection
- Secure payment flows

## Future Enhancements

### Planned Features
- Additional utility types (sewage, waste management)
- AI-powered usage optimization
- Voice control integration
- Augmented reality features
- Blockchain-based payments

### Scalability
- Microservices architecture
- GraphQL API integration
- Real-time synchronization
- Offline functionality
- Progressive web app

## Best Practices

### Development
- Component composition
- Prop drilling avoidance
- Custom hooks for logic
- Error boundary implementation
- Performance monitoring

### User Experience
- Progressive disclosure
- Clear visual hierarchy
- Consistent interactions
- Fast feedback loops
- Graceful error handling

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive testing
- Documentation maintenance

This multi-utility support interface provides a comprehensive, scalable, and user-friendly solution for managing multiple utility types within the NEPA platform, ensuring consistent experience while maintaining utility-specific functionality and branding.
