import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Camera } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../store/auth.store';
import { authService } from '../../../services/auth.service';
import { useToast } from '../../../hooks/useToast';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  host: 'Anfitrião',
  guest: 'Hóspede',
};

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { success, error: showError } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);

  const { register: regProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    },
  });

  const { register: regPwd, handleSubmit: handlePwdSubmit, reset: resetPwd, formState: { errors: pwdErrors, isSubmitting: pwdSubmitting } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const updated = await authService.updateProfile({ ...data, avatar: avatarPreview });
      updateUser(updated);
      success('Perfil atualizado com sucesso!');
    } catch {
      showError('Erro ao atualizar perfil');
    }
  };

  const onPasswordSubmit = async (_data: PasswordFormData) => {
    // In mock, we just show success
    success('Senha alterada com sucesso!');
    resetPwd();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Meu Perfil</h1>
        <p className="text-sm text-neutral-500">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={user.name}
              size="xl"
            />
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-light transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">{user.name}</h2>
            <p className="text-sm text-neutral-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">{roleLabels[user.role] || user.role}</Badge>
              {user.verified && <Badge variant="success">Verificado</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card-base p-5">
        <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Informações Pessoais
        </h2>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <Input label="Nome completo" error={profileErrors.name?.message} {...regProfile('name')} />
          <Input label="E-mail" defaultValue={user.email} disabled className="opacity-60" />
          <Input label="Telefone" placeholder="(11) 99999-9999" error={profileErrors.phone?.message} {...regProfile('phone')} />
          <Textarea
            label="Bio"
            placeholder="Conte um pouco sobre você..."
            rows={4}
            showCounter
            maxLength={500}
            error={profileErrors.bio?.message}
            {...regProfile('bio')}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={profileSubmitting}>Salvar alterações</Button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="card-base p-5">
        <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Alterar Senha
        </h2>
        <form onSubmit={handlePwdSubmit(onPasswordSubmit)} className="space-y-4">
          <Input label="Senha atual" type="password" error={pwdErrors.currentPassword?.message} {...regPwd('currentPassword')} />
          <Input label="Nova senha" type="password" error={pwdErrors.newPassword?.message} {...regPwd('newPassword')} />
          <Input label="Confirmar nova senha" type="password" error={pwdErrors.confirmPassword?.message} {...regPwd('confirmPassword')} />
          <div className="flex justify-end">
            <Button type="submit" loading={pwdSubmitting}>Alterar senha</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
