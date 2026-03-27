import { Calendar, User, Mail, Phone, AlertCircle, CheckCircle2, ArrowRightLeft, Ban, Clock } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useChannelReservations } from '../../../hooks/useBookingCom';
import type { ChannelReservation } from '../../../types';

interface Props {
  propertyChannelId?: string;
}

export function ReservationsFeed({ propertyChannelId }: Props) {
  const { data: reservations, isLoading } = useChannelReservations(propertyChannelId);

  const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'new':
        return <Badge variant="success">Nova</Badge>;
      case 'modify':
        return <Badge variant="warning">Modificada</Badge>;
      case 'cancel':
        return <Badge variant="error">Cancelada</Badge>;
      default:
        return <Badge variant="default">{type || 'Desconhecido'}</Badge>;
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'new':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'modify':
        return <ArrowRightLeft className="w-4 h-4 text-yellow-500" />;
      case 'cancel':
        return <Ban className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-400" />;
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (!propertyChannelId) {
    return (
      <div className="card-base p-8 text-center text-neutral-500">
        Selecione uma propriedade para ver as reservas do canal.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-base p-6 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Reservas do Canal
          {reservations && reservations.length > 0 && (
            <Badge variant="default">{reservations.length}</Badge>
          )}
        </h3>
      </div>

      {!reservations || reservations.length === 0 ? (
        <div className="p-12 text-center text-neutral-500">
          Nenhuma reserva recebida do canal ainda.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {reservations.map((res: ChannelReservation) => (
            <div key={res.id} className="p-4 hover:bg-neutral-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getTypeIcon(res.reservationType)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-800">
                        {res.externalReservationId}
                      </span>
                      {getTypeBadge(res.reservationType)}
                      {res.processedAt && (
                        <Badge variant="success">Processada</Badge>
                      )}
                      {res.processError && (
                        <Badge variant="error">Erro</Badge>
                      )}
                    </div>

                    {res.guestName && (
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {res.guestName}
                        </span>
                        {res.guestEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {res.guestEmail}
                          </span>
                        )}
                        {res.guestPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {res.guestPhone}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <span>
                        {formatDate(res.checkInDate)} → {formatDate(res.checkOutDate)}
                      </span>
                      <span>
                        {res.adults} adulto{res.adults !== 1 ? 's' : ''}
                        {res.children > 0 && `, ${res.children} criança${res.children !== 1 ? 's' : ''}`}
                      </span>
                      {res.roomsCount > 1 && (
                        <span>{res.roomsCount} quartos</span>
                      )}
                    </div>

                    {res.processError && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        {res.processError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {res.totalAmount != null && (
                    <p className="font-semibold text-neutral-800">
                      {res.currency} {res.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatDateTime(res.receivedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
