import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login-auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  register(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @MessagePattern('auth.login.user')
  login(@Payload() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern('auth.verify.user')
  verifyToken(@Payload() token: string) {
    return this.authService.verifyToken(token);
  }

  @MessagePattern('auth.get.user')
  getUser(@Payload() token: string) {
    return this.authService.findOneByToken(token);
  }

  @MessagePattern('auth.find.user')
  findUser(@Payload() email: string) {
    return this.authService.findOneBy(email);
  }

  @MessagePattern('auth.find.user.by.id')
  findUserById(@Payload() id: string) {
    return this.authService.findOneById(id);
  }
}
