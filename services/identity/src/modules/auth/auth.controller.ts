import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @MessagePattern('auth.register')
  async register(@Payload() data: any) {
    return this.service.register(data);
  }

  @MessagePattern('auth.login')
  async login(@Payload() data: any) {
    return this.service.login(data);
  }
<<<<<<< HEAD

  @MessagePattern('identity.auth.refresh')
  async refresh(@Payload() data: any) {
    return this.service.refresh(data);
  }
=======
>>>>>>> 6b3ef18c554ad388ebedb3c2b539448949d26d68
}
