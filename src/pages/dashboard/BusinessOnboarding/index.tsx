import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Link2, Home, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { WizardStepper } from './WizardStepper';
import { StepBusinessInfo } from './StepBusinessInfo';
import { StepAddress } from './StepAddress';
import { StepChannels } from './StepChannels';
import { StepAccommodation } from './StepAccommodation';
import { StepReview } from './StepReview';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useCreateBusiness, useAdvanceOnboardingStep, useCompleteOnboarding } from '../../../hooks/useBusiness';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../router/routes';

const STEP_INFO = [
  { 
    num: 1, 
    label: 'Empresa', 
    icon: Building2,
    title: 'Dados da Empresa',
    description: 'Comece informando os dados básicos do seu negócio de hospedagem.'
  },
  { 
    num: 2, 
    label: 'Endereço', 
    icon: MapPin,
    title: 'Localização',
    description: 'Informe o endereço principal da sua empresa.'
  },
  { 
    num: 3, 
    label: 'Canais', 
    icon: Link2,
    title: 'Canais de Venda',
    description: 'Conecte suas contas em plataformas de hospedagem para importar automaticamente.'
  },
  { 
    num: 4, 
    label: 'Acomodação', 
    icon: Home,
    title: 'Primeira Acomodação',
    description: 'Adicione sua primeira acomodação importando ou criando manualmente.'
  },
  { 
    num: 5, 
    label: 'Revisão', 
    icon: CheckCircle2,
    title: 'Revisão Final',
    description: 'Revise todas as informações antes de finalizar.'
  },
];

export function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const { currentStep, setStep, businessData, selectedChannels, importedPropertyIds, manualPropertyId, reset } = useOnboardingStore();
  const createBusinessMutation = useCreateBusiness();
  const advanceStep = useAdvanceOnboardingStep();
  const completeOnboarding = useCompleteOnboarding();
  const [completed, setCompleted] = useState(false);

  const stepInfo = STEP_INFO.find(s => s.num === currentStep) || STEP_INFO[0];
  const StepIcon = stepInfo.icon;

  const goNext = () => {
    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setStep(nextStep);
      advanceStep.mutate(nextStep);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!businessData.name || !businessData.document || !businessData.type || !businessData.phone || !businessData.email) {
      return;
    }
    
    try {
      await createBusinessMutation.mutateAsync({
        ownerId: 'u2', // Demo user
        name: businessData.name,
        legalName: businessData.legalName,
        document: businessData.document,
        documentType: businessData.documentType || 'cnpj',
        type: businessData.type,
        description: businessData.description,
        logo: businessData.logo,
        address: businessData.address || {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
        },
        phone: businessData.phone,
        email: businessData.email,
        website: businessData.website,
        onboardingCompleted: true,
        onboardingStep: 5,
      });
      await completeOnboarding.mutateAsync();
      setCompleted(true);
      reset();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (completed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-lg text-center">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">
            Parabéns! Cadastro Concluído
          </h1>
          <p className="text-neutral-500 mb-8 text-lg">
            Sua empresa foi cadastrada com sucesso. Agora você pode gerenciar suas acomodações, 
            conectar mais canais de venda e começar a receber reservas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate(ROUTES.DASHBOARD)} size="lg">
              <ArrowRight className="w-5 h-5 mr-2" />
              Ir para o Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/channels')} size="lg">
              <Link2 className="w-5 h-5 mr-2" />
              Gerenciar Canais
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          Configuração Inicial
        </h1>
        <p className="text-neutral-500">
          Complete as etapas abaixo para começar a usar todas as funcionalidades da plataforma.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 p-6 card-base">
        <WizardStepper current={currentStep} onStepClick={setStep} />
      </div>

      {/* Current Step Info */}
      <div className="mb-6 flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
          <StepIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-neutral-800">{stepInfo.title}</h2>
          <p className="text-sm text-neutral-500">{stepInfo.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && <StepBusinessInfo onNext={goNext} />}
        {currentStep === 2 && <StepAddress onNext={goNext} onBack={goBack} />}
        {currentStep === 3 && <StepChannels onNext={goNext} onBack={goBack} />}
        {currentStep === 4 && <StepAccommodation onNext={goNext} onBack={goBack} />}
        {currentStep === 5 && (
          <StepReview 
            onBack={goBack} 
            onComplete={handleComplete}
            isLoading={createBusinessMutation.isPending}
          />
        )}
      </div>

      {/* Progress Summary (bottom card) */}
      <div className="card-base p-4 bg-neutral-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            {businessData.name && (
              <span className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>Empresa: {businessData.name}</span>
              </span>
            )}
            {selectedChannels.length > 0 && (
              <span className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedChannels.length} canais selecionados</span>
              </span>
            )}
            {(importedPropertyIds.length > 0 || manualPropertyId) && (
              <span className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>{importedPropertyIds.length + (manualPropertyId ? 1 : 0)} acomodações</span>
              </span>
            )}
          </div>
          <span className="text-neutral-400">
            Etapa {currentStep} de 5
          </span>
        </div>
      </div>
    </div>
  );
}
