import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelService } from '../services/channel.service';
import type { ChannelConnection, Property, Booking } from '../types';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.getChannels(),
  });
}

export function useChannelConnections(businessId?: string) {
  return useQuery({
    queryKey: ['channel-connections', businessId],
    queryFn: () => channelService.getConnections(businessId!),
    enabled: !!businessId,
  });
}

export function useConnectChannel() {
  const qc = useQueryClient();
  return useMutation<ChannelConnection, Error, { businessId: string; channelSlug: string; accountEmail: string }>({
    mutationFn: ({ businessId, channelSlug, accountEmail }) =>
      channelService.connect(businessId, channelSlug, accountEmail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channel-connections'] }),
  });
}

export function useDisconnectChannel() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (connectionId) => channelService.disconnect(connectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channel-connections'] }),
  });
}

export function useImportProperties() {
  const qc = useQueryClient();
  return useMutation<Property[], Error, string>({
    mutationFn: (connectionId) => channelService.importProperties(connectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channel-connections'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['channel-import-logs'] });
    },
  });
}

export function useImportBookings() {
  const qc = useQueryClient();
  return useMutation<Booking[], Error, string>({
    mutationFn: (connectionId) => channelService.importBookings(connectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channel-connections'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['channel-import-logs'] });
    },
  });
}

export function useSyncChannel() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (connectionId) => channelService.syncNow(connectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channel-connections'] }),
  });
}

export function useUpdateSyncSettings() {
  const qc = useQueryClient();
  return useMutation<ChannelConnection, Error, { connectionId: string; settings: { autoSync?: boolean; syncIntervalHours?: number } }>({
    mutationFn: ({ connectionId, settings }) =>
      channelService.updateSyncSettings(connectionId, settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channel-connections'] }),
  });
}

export function useImportLogs(connectionId?: string) {
  return useQuery({
    queryKey: ['channel-import-logs', connectionId],
    queryFn: () => channelService.getImportLogs(connectionId!),
    enabled: !!connectionId,
  });
}
