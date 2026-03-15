import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { FileUpload } from '../../../components/ui/FileUpload';
import { useToast } from '../../../hooks/useToast';
import { useProperty, useCreateProperty, useUpdateProperty } from '../../../hooks/useProperties';
import { useAuthStore } from '../../../store/auth.store';
import { AMENITIES_LIST } from '../../../mocks/data';
import { ROUTES } from '../../../router/routes';
import { Spinner } from '../../../components/ui/Spinner';
import type { PropertyType, PropertyStatus } from '../../../types';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['hotel', 'pousada', 'hostel', 'apartamento', 'resort', 'chalé']),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
  pricePerNight: z.coerce.number().min(1, 'Preço inválido'),
  maxGuests: z.coerce.number().min(1).max(50),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(0),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  amenities: z.array(z.string()),
  images: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
});

type FormData = z.infer<typeof schema>;

const typeOptions = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'resort', label: 'Resort' },
  { value: 'chalé', label: 'Chalé' },
];

const stateOptions = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s => ({ value: s, label: s }));

export function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();
  const { data: existing, isLoading } = useProperty(id || '');
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      type: 'hotel',
      amenities: [],
      images: [],
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
    },
  });

  useEffect(() => {
    if (existing && isEditing) {
      reset({
        name: existing.name,
        type: existing.type as FormData['type'],
        description: existing.description,
        street: existing.address.street,
        number: existing.address.number,
        complement: existing.address.complement,
        neighborhood: existing.address.neighborhood,
        city: existing.address.city,
        state: existing.address.state,
        zipCode: existing.address.zipCode,
        pricePerNight: existing.pricePerNight,
        maxGuests: existing.maxGuests,
        bedrooms: existing.bedrooms,
        bathrooms: existing.bathrooms,
        checkInTime: existing.checkInTime,
        checkOutTime: existing.checkOutTime,
        amenities: existing.amenities,
        images: existing.images.map((i) => i.url),
      });
    }
  }, [existing, isEditing, reset]);

  const watchedAmenities = watch('amenities') || [];

  const toggleAmenity = (id: string) => {
    const current = watchedAmenities;
    setValue('amenities', current.includes(id) ? current.filter((a) => a !== id) : [...current, id]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const propertyData = {
        name: data.name,
        type: data.type as PropertyType,
        description: data.description,
        address: {
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        },
        pricePerNight: data.pricePerNight,
        maxGuests: data.maxGuests,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        amenities: data.amenities,
        images: data.images.map((url, idx) => ({
          id: `img_${idx}`,
          url,
          alt: data.name,
          isPrimary: idx === 0,
        })),
        ownerId: user?.id || '',
        ownerName: user?.name || '',
        ownerAvatar: user?.avatar,
        status: 'active' as PropertyStatus,
      };

      if (isEditing && id) {
        await updateProperty.mutateAsync({ id, data: propertyData });
        success('Propriedade atualizada com sucesso!');
      } else {
        await createProperty.mutateAsync(propertyData);
        success('Propriedade criada com sucesso!');
      }
      navigate(ROUTES.DASHBOARD_PROPERTIES);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao salvar propriedade');
    }
  };

  if (isEditing && isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{isEditing ? 'Editar Acomodação' : 'Nova Acomodação'}</h1>
        <p className="text-sm text-neutral-500 mt-1">Preencha as informações da sua propriedade</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Informações Básicas</h2>
          <div className="space-y-4">
            <Input label="Nome da propriedade" placeholder="Ex: Hotel Grand Plaza" error={errors.name?.message} {...register('name')} />
            <Select label="Tipo" options={typeOptions} error={errors.type?.message} {...register('type')} />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Textarea
                  label="Descrição"
                  placeholder="Descreva sua propriedade..."
                  rows={5}
                  showCounter
                  maxLength={2000}
                  error={errors.description?.message}
                  {...field}
                />
              )}
            />
          </div>
        </div>

        {/* Address */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Rua" placeholder="Nome da rua" error={errors.street?.message} {...register('street')} />
            </div>
            <Input label="Número" placeholder="123" error={errors.number?.message} {...register('number')} />
            <Input label="Complemento" placeholder="Apto 101" {...register('complement')} />
            <Input label="Bairro" placeholder="Centro" error={errors.neighborhood?.message} {...register('neighborhood')} />
            <Input label="Cidade" placeholder="São Paulo" error={errors.city?.message} {...register('city')} />
            <Select label="Estado" options={stateOptions} placeholder="UF" error={errors.state?.message} {...register('state')} />
            <Input label="CEP" placeholder="00000-000" error={errors.zipCode?.message} {...register('zipCode')} />
          </div>
        </div>

        {/* Prices & Capacity */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Preços e Capacidade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input label="Preço/noite (R$)" type="number" min="1" error={errors.pricePerNight?.message} {...register('pricePerNight')} />
            <Input label="Máx. hóspedes" type="number" min="1" max="50" error={errors.maxGuests?.message} {...register('maxGuests')} />
            <Input label="Quartos" type="number" min="0" error={errors.bedrooms?.message} {...register('bedrooms')} />
            <Input label="Banheiros" type="number" min="0" error={errors.bathrooms?.message} {...register('bathrooms')} />
            <Input label="Check-in" type="time" {...register('checkInTime')} />
            <Input label="Check-out" type="time" {...register('checkOutTime')} />
          </div>
        </div>

        {/* Amenities */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Comodidades</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AMENITIES_LIST.map((amenity) => (
              <Checkbox
                key={amenity.id}
                label={amenity.label}
                checked={watchedAmenities.includes(amenity.id)}
                onChange={() => toggleAmenity(amenity.id)}
              />
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Fotos</h2>
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <FileUpload
                onFilesChange={field.onChange}
                existingFiles={field.value}
                maxFiles={10}
              />
            )}
          />
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 justify-end">
          <Link to={ROUTES.DASHBOARD_PROPERTIES}>
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button type="submit" loading={isSubmitting || createProperty.isPending || updateProperty.isPending}>
            {isEditing ? 'Salvar alterações' : 'Criar propriedade'}
          </Button>
        </div>
      </form>
    </div>
  );
}
