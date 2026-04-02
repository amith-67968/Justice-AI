import React from 'react';
import AuthShell from '../components/ui/AuthShell';
import ModernAnimatedAuth from '../components/ui/ModernAnimatedAuth';

export default function SignupPage() {
  return (
    <AuthShell>
        <ModernAnimatedAuth mode="signup" />
    </AuthShell>
  );
}
