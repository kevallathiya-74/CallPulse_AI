import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, UserCircle2 } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { useUserService } from '../services/userService';
import { useToast } from '../hooks/useToast';
import { QUERY_KEYS } from '../constants/queryKeys';

export default function Settings() {
  const userService = useUserService();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: profileRes, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: () => userService.getProfile(),
    staleTime: 60 * 1000,
  });

  const profile = profileRes?.data?.user || profileRes?.user || null;

  const [form, setForm] = useState({ full_name: '', organization_name: '' });

  React.useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      organization_name: profile.organization_name || '',
    });
  }, [profile]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      form.full_name !== (profile.full_name || '')
      || form.organization_name !== (profile.organization_name || '')
    );
  }, [form, profile]);

  const updateMutation = useMutation({
    mutationFn: () => userService.updateProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      toast.success('Profile updated successfully');
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update profile');
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name?.trim()) {
      toast.error('Full name is required');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <PageWrapper hideFooter>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="heading-md text-text-primary">Settings</h1>
          <p className="text-text-muted text-sm">Manage your user and organization profile</p>
        </div>

        <GlassCard className="p-6" hover={false}>
          {isLoading ? (
            <p className="text-text-muted text-sm">Loading profile...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="full_name" className="text-sm text-text-muted mb-2 flex items-center gap-2">
                  <UserCircle2 size={14} /> Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm outline-none transition-colors focus:border-primary/60"
                />
              </div>

              <div>
                <label htmlFor="organization_name" className="text-sm text-text-muted mb-2 flex items-center gap-2">
                  <Building2 size={14} /> Organization
                </label>
                <input
                  id="organization_name"
                  name="organization_name"
                  value={form.organization_name}
                  onChange={(e) => setForm((s) => ({ ...s, organization_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm outline-none transition-colors focus:border-primary/60"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" icon={<Save size={16} />} disabled={!hasChanges} loading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
