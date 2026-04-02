import React from 'react';

import AuthShell from '../components/ui/AuthShell';
import ModernAnimatedAuth from '../components/ui/ModernAnimatedAuth';

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ModernAnimatedAuth mode="reset-password" />
    </AuthShell>
  );
}
