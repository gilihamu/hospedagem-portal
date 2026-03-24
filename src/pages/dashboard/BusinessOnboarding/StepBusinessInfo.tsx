import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { useOnboardingStore } from '../../../store/onboarding.store';

const schema = z.object({
  name: z.string().min(3, 'Nome da empresa deve ter pelo menos 3 caracteres'),
  legalName: z.string().optional(),
  documentType: z.enum(['cnpj', 'cpf']),
  document: z.string().min(11, 'Documento inválido'),
  type: z.enum(['hotel', 'pousada', 'hostel', 'resort', 'property_manager', 'individual']),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onNext: () => void;
}

const BUSINESS_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'resort', label: 'Resort' },
  { value: 'property_manager', label: 'Administradora de Imóveis' },
  { value: 'individual', label: 'Anfitrião Individual' },
];

export function StepBusinessInfo({ onNext }: Props) {
  const { businessData, setBusinessData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: businessData.name || '',
      legalName: businessData.legalName || '',
      documentType: businessData.documentType || 'cnpj',
      document: businessData.document || '',
      type: businessData.type || 'hotel',
      description: businessData.description || '',
    },
  });

  const onSubmit = (data: FormData) => {
    setBusinessData(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card-base p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">Dados da Empresa</h3>
            <p className="text-sm text-neutral-500">Informações básicas do seu negócio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome Fantasia *"
            placeholder="Ex: Hotel Boutique Ipanema"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Razão Social"
            placeholder="Ex: Oliveira Hospedagens LTDA"
            error={errors.legalName?.message}
            {...register('legalName')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Select
            label="Tipo de Documento *"
            error={errors.documentType?.message}
            options={[
              { value: 'cnpj', label: 'CNPJ' },
              { value: 'cpf', label: 'CPF' },
            ]}
            {...register('documentType')}
          />
          <Input
            label="Número do Documento *"
            placeholder="00.000.000/0001-00"
            error={errors.document?.message}
            {...register('document')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Select
            label="Tipo de Negócio *"
            error={errors.type?.message}
            options={BUSINESS_TYPES}
            {...register('type')}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Descrição da Empresa"
            placeholder="Conte um pouco sobre sua empresa e seus diferenciais..."
            rows={3}
            {...register('description')}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  );
}
