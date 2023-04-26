import { ProSettings } from '../../models/ProSettings';

export interface CreateNetworkDto {
  netid: string;
  isipv4: 'no' | 'yes';
  isipv6: 'no' | 'yes';
  addressrange: string;
  addressrange6: string;
  defaultudpholepunch: 'no' | 'yes';
  defaultacl: 'no' | 'yes';
  prosettings?: ProSettings;
  defaultDns?: string;
}
