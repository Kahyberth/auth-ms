import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
// import { LoginDto } from './dto/login-auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  register(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.createUser(createAuthDto);
  }

  @MessagePattern('auth.login.user')
  login(@Payload() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern('auth.verify.user')
  verifyToken(@Payload() token: string) {
    return this.authService.verifyToken(token);
  }

  @MessagePattern('auth.get.profile')
  getUser(@Payload() id: string) {
    return this.authService.profile(id);
  }

  @MessagePattern('auth.find.user')
  findUser(@Payload() email: string) {
    return this.authService.findOne(email);
  }

  @MessagePattern('auth.find.user.by.id')
  findUserById(@Payload() id: string) {
    return this.authService.findOneById(id);
  }

  @MessagePattern('auth.refresh.token')
  refreshToken(@Payload() refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @MessagePattern('auth.update.profile')
  updateProfile(@Payload() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(updateProfileDto);
  }

  
  @MessagePattern('auth.ping')
  ping() {
    return 'pong';
  }
}
