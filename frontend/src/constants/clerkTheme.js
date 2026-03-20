import { dark } from '@clerk/themes';

export const getClerkAppearance = (isSignUp = false) => {
  const primaryColor = isSignUp ? '#7B2FFF' : '#00D4FF';
  const gradient = isSignUp
    ? 'linear-gradient(135deg, #7B2FFF 0%, #00D4FF 100%)'
    : 'linear-gradient(135deg, #00D4FF 0%, #7B2FFF 100%)';
  const shadowBase = isSignUp ? '123,47,255' : '0,212,255';
  
  return {
    baseTheme: dark,
    variables: {
      colorPrimary: '#00D4FF',
      colorBackground: '#0a1628',
      colorInputBackground: '#0d1f38',
      colorInputText: '#FFFFFF',
      colorText: '#E8F4FD',
      colorTextSecondary: '#aab4c2',
      colorTextOnPrimaryBackground: '#FFFFFF',
      colorDanger: '#FF3D57',
      borderRadius: '14px',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
    },
    elements: {
      rootBox: {
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(${shadowBase},0.05)`,
      },
      card: {
        background: 'rgba(10,22,40,0.95)',
        border: `1px solid rgba(${shadowBase},0.12)`,
        backdropFilter: 'blur(24px)',
        padding: '40px 36px',
      },
      headerTitle: {
        fontFamily: 'Syne, sans-serif',
        fontSize: '26px',
        fontWeight: '700',
        color: '#E8F4FD !important',
      },
      headerSubtitle: {
        color: '#aab4c2 !important',
        fontSize: '14px',
      },
      socialButtonsBlockButton: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#E8F4FD !important',
        transition: 'all 0.2s',
        '&:hover': { background: 'rgba(255,255,255,0.08)', borderColor: `rgba(${shadowBase},0.3)` },
      },
      socialButtonsBlockButtonText: {
        color: '#E8F4FD !important',
      },
      formButtonPrimary: {
        background: gradient,
        border: 'none',
        fontWeight: '600',
        fontSize: '15px',
        padding: '12px',
        transition: 'all 0.2s',
        color: '#FFFFFF !important',
        '&:hover': { opacity: 0.9, transform: 'translateY(-1px)', boxShadow: `0 8px 30px rgba(${shadowBase},0.3)` },
      },
      formFieldInput: {
        background: 'rgba(13,31,56,0.8) !important',
        border: '1px solid rgba(255,255,255,0.08) !important',
        color: '#FFFFFF !important',
        fontSize: '14px',
        padding: '12px 14px',
        transition: 'border-color 0.2s',
        '&:focus': { borderColor: `rgba(${shadowBase},0.4) !important`, boxShadow: `0 0 0 3px rgba(${shadowBase},0.08) !important` },
        '&::placeholder': { color: '#8892b0 !important' },
      },
      formFieldLabel: {
        color: '#E8F4FD !important',
        fontSize: '13px',
        fontWeight: '500',
      },
      formFieldHintText: {
        display: 'none',
      },
      formFieldLabel__optional: {
        display: 'none',
      },
      footer: {
        justifyContent: 'center',
        '& > *': {
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: 'center',
          flexWrap: 'nowrap',
        },
        '& a': { color: primaryColor, fontWeight: '600' },
      },
      footerActionText: {
        display: 'inline',
        marginRight: '4px',
        color: '#aab4c2 !important',
      },
      footerActionLink: {
        display: 'inline',
        color: `${primaryColor} !important`,
        fontWeight: '600',
      },
      dividerLine: {
        background: 'rgba(255,255,255,0.08) !important',
      },
      dividerText: {
        color: '#8892b0 !important',
      },
      identityPreviewEditButton: {
        color: '#00D4FF !important',
      },
      badge: {
        background: 'rgba(255,255,255,0.1) !important',
        color: '#FFFFFF !important',
      },
    },
  };
};
