import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { useCreateBranch } from '../../../hooks/useBranches';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { useAuthStore } from '../../../store/auth.store';
import { ROUTES } from '../../../router/routes';

const schema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  propertyId: z.string().min(1, 'Selecione uma propriedade'),
  manager: z.string().min(2, 'Gerente é obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  street: z.string().min(2, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
});

type FormData = z.infer<typeof schema>;

const stateOptions = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s => ({ value: s, label: s }));

export function BranchFormPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const createBranch = useCreateBranch();
  const { data: properties } = useOwnerProperties(user?.id);

  const propertyOptions = properties?.map((p) => ({ value: p.id, label: p.name })) || [];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createBranch.mutateAsync({
        name: data.name,
        propertyId: data.propertyId,
        manager: data.manager,
        phone: data.phone,
        email: data.email,
        active: true,
        address: {
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        },
      });
      success('Filial criada com sucesso!');
      navigate(ROUTES.DASHBOARD_BRANCHES);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao criar filial');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Nova Filial</h1>
        <p className="text-sm text-neutral-500 mt-1">Adicione uma nova filial a uma propriedade</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card-base p-5 space-y-4">
          <h2 className="font-semibold text-neutral-800">Informações da Filial</h2>
          <Input label="Nome da filial" placeholder="Ex: Filial Centro" error={errors.name?.message} {...register('name')} />
          <Select
            label="Propriedade"
            options={propertyOptions}
            placeholder="Selecione uma propriedade"
            error={errors.propertyId?.message}
            {...register('propertyId')}
          />
          <Input label="Gerente" placeholder="Nome do gerente" error={errors.manager?.message} {...register('manager')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" placeholder="(11) 99999-9999" error={errors.phone?.message} {...register('phone')} />
            <Input label="E-mail" type="email" placeholder="filial@email.com" error={errors.email?.message} {...register('email')} />
          </div>
        </div>

        <div className="card-base p-5 space-y-4">
          <h2 className="font-semibold text-neutral-800">Endereço</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Rua" error={errors.street?.message} {...register('street')} />
            </div>
            <Input label="Número" error={errors.number?.message} {...register('number')} />
            <Input label="Complemento" {...register('complement')} />
            <Input label="Bairro" error={errors.neighborhood?.message} {...register('neighborhood')} />
            <Input label="Cidade" error={errors.city?.message} {...register('city')} />
            <Select label="Estado" options={stateOptions} error={errors.state?.message} {...register('state')} />
            <Input label="CEP" error={errors.zipCode?.message} {...register('zipCode')} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to={ROUTES.DASHBOARD_BRANCHES}>
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button type="submit" loading={isSubmitting || createBranch.isPending}>
            Criar filial
          </Button>
        </div>
      </form>
    </div>
  );
}
