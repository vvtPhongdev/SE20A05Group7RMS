import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. Kiểm tra xem API hoặc Controller có gắn decorator @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu là Public, cho qua luôn, không cần check Token
    if (isPublic) {
      return true;
    }

    // 2. Nếu không Public, kích hoạt logic kiểm tra JWT mặc định của Passport
    return super.canActivate(context);
  }

  // Bạn có thể tùy chỉnh phản hồi lỗi 401 tại đây nếu cần
  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('You need Signin to access this resource');
    }
    return user;
  }
}