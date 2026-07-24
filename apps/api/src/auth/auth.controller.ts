import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post('login')
	login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@Post('refresh')
	refresh(@Body('refreshToken') refreshToken: string) {
		return this.authService.refresh(refreshToken);
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	getMe(@Req() req: any) {
		return req.user;
	}
}
