import { Building2, MapPin, Link2, Home, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useChannels } from '../../../hooks/useChannels';

interface Props {
  onBack: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

const BUSINESS_TYPES: Record<string, string> = {
  hotel: 'Hotel',
  pousada: 'Pousada',
  hostel: 'Hostel',
  resort: 'Resort',
  property_manager: 'Administradora de Imóveis',
  individual: 'Anfitrião Individual',
};

export function StepReview({ onBack, onComplete, isLoading }: Props) {
  const { businessData, selectedChannels, importedPropertyIds, manualPropertyId } = useOnboardingStore();
  const { data: channels } = useChannels();

  const selectedChannelNames = channels
    ?.filter(ch => selectedChannels.includes(ch.slug))
    .map(ch => ch.name) || [];

  const totalProperties = importedPropertyIds.length + (manualPropertyId ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="card-base p-6">
        <h3 className="font-semibold text-neutral-800 mb-1">Revise suas Informações</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Confira todos os dados antes de finalizar o cadastro da sua empresa.
        </p>

        {/* Business Info */}
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-neutral-800">Dados da Empresa</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Nome Fantasia</dt>
                <dd className="font-medium text-neutral-800">{businessData.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Razão Social</dt>
                <dd className="font-medium text-neutral-800">{businessData.legalName || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Documento</dt>
                <dd className="font-medium text-neutral-800">
                  {businessData.documentType?.toUpperCase()}: {businessData.document || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Tipo de Negócio</dt>
                <dd className="font-medium text-neutral-800">
                  {businessData.type ? BUSINESS_TYPES[businessData.type] : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Telefone</dt>
                <dd className="font-medium text-neutral-800">{businessData.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Email</dt>
                <dd className="font-medium text-neutral-800">{businessData.email || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Address */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-semibold text-neutral-800">Endereço</h4>
            </div>
            {businessData.address ? (
              <p className="text-sm text-neutral-700">
                {businessData.address.street}, {businessData.address.number}
                {businessData.address.complement && ` - ${businessData.address.complement}`}
                <br />
                {businessData.address.neighborhood}, {businessData.address.city} - {businessData.address.state}
                <br />
                CEP: {businessData.address.zipCode}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">Endereço não informado</p>
            )}
          </div>

          {/* Channels */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-neutral-800">Canais de Venda</h4>
            </div>
            {selectedChannelNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedChannelNames.map(name => (
                  <span
                    key={name}
                    className="px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Nenhum canal selecionado (você pode conectar depois)</p>
            )}
          </div>

          {/* Accommodations */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-neutral-800">Acomodações</h4>
            </div>
            {totalProperties > 0 ? (
              <div className="text-sm">
                <p className="text-neutral-700">
                  <span className="font-semibold text-green-600">{totalProperties}</span> acomodação(ões) adicionadas
                </p>
                {importedPropertyIds.length > 0 && (
                  <p className="text-neutral-500 mt-1">
                    • {importedPropertyIds.length} importadas dos canais
                  </p>
                )}
                {manualPropertyId && (
                  <p className="text-neutral-500 mt-1">
                    • 1 criada manualmente
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Nenhuma acomodação adicionada ainda</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
        <p className="text-sm text-success font-medium">
          ✓ Tudo pronto! Ao finalizar, você terá acesso completo ao painel de administração.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onComplete} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Finalizando...
            </>
          ) : (
            'Finalizar Cadastro'
          )}
        </Button>
      </div>
    </div>
  );
}
