import { Injectable } from '@nestjs/common';

@Injectable()
export class ApplicationsService {
  findAll() {
    return { message: 'Applications endpoint — not yet implemented' };
  }
}
