import { Role } from '../../common/enums/domain.enum.js';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
