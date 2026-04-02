import React from 'react';

import AuthShell from '../components/ui/AuthShell';
import ModernAnimatedAuth from '../components/ui/ModernAnimatedAuth';

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ModernAnimatedAuth mode="forgot-password" />
    </AuthShell>
  );
}
