import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useOnboardingStore } from '../../../store/onboarding.store';

const schema = z.object({
  street: z.string().min(3, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().min(2, 'Estado obrigatório').max(2, 'Use a sigla do estado'),
  zipCode: z.string().min(8, 'CEP inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido'),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepAddress({ onNext, onBack }: Props) {
  const { businessData, setBusinessData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      street: businessData.address?.street || '',
      number: businessData.address?.number || '',
      complement: businessData.address?.complement || '',
      neighborhood: businessData.address?.neighborhood || '',
      city: businessData.address?.city || '',
      state: businessData.address?.state || '',
      zipCode: businessData.address?.zipCode || '',
      phone: businessData.phone || '',
      email: businessData.email || '',
      website: businessData.website || '',
    },
  });

  const onSubmit = (data: FormData) => {
    const { street, number, complement, neighborhood, city, state, zipCode, phone, email, website } = data;
    setBusinessData({
      address: { street, number, complement, neighborhood, city, state, zipCode },
      phone,
      email,
      website,
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Address */}
      <div className="card-base p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">Endereço</h3>
            <p className="text-sm text-neutral-500">Endereço sede da empresa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input label="Rua *" placeholder="Ex: Av. Atlântica" error={errors.street?.message} {...register('street')} />
          </div>
          <Input label="Número *" placeholder="1500" error={errors.number?.message} {...register('number')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input label="Complemento" placeholder="Sala 301" {...register('complement')} />
          <Input label="Bairro *" placeholder="Copacabana" error={errors.neighborhood?.message} {...register('neighborhood')} />
          <Input label="CEP *" placeholder="22021-000" error={errors.zipCode?.message} {...register('zipCode')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input label="Cidade *" placeholder="Rio de Janeiro" error={errors.city?.message} {...register('city')} />
          <Input label="Estado *" placeholder="RJ" error={errors.state?.message} {...register('state')} />
        </div>
      </div>

      {/* Contact */}
      <div className="card-base p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">Contato</h3>
            <p className="text-sm text-neutral-500">Informações de contato da empresa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Telefone *" placeholder="+55 21 99999-0001" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email *" placeholder="contato@empresa.com" error={errors.email?.message} {...register('email')} />
        </div>

        <div className="mt-4">
          <Input label="Website" placeholder="https://www.suaempresa.com.br" error={errors.website?.message} {...register('website')} />
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Voltar</Button>
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  );
}
