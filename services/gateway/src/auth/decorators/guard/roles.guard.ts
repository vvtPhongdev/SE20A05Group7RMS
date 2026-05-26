import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách các Roles được phép truy cập từ Decorator @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu API không yêu cầu Role cụ thể nào, cho qua
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy thông tin user (đã được JwtAuthGuard gán vào request ở bước trước)
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      return false; // Không có user hoặc user không có role -> Block (403 Forbidden)
    }

    // Kiểm tra xem role của user có nằm trong danh sách được phép không
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}