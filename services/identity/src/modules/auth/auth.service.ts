import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  findAll() {
    return { message: 'Auth endpoint — not yet implemented' };
  }
}
