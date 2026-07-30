import {
        Body,
        Controller,
        Get,
        Param,
        Post,
        Req,
        Headers,
        UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Controller('payments')
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Post('initialize')
	@UseGuards(JwtAuthGuard)
	initialize(
		@Req() req,
		@Body() dto: InitializePaymentDto,
	) {
		return this.paymentsService.initialize(
			req.user.id,
			dto.registrationId,
		);
	}

	@Get('verify/:reference')
	verify(
		@Param('reference') reference: string,
	) {
		return this.paymentsService.verify(reference);
	}

	@Post('webhook')
webhook(
        @Body() payload:any,
        @Headers('x-paystack-signature') signature:string,
) {

        return this.paymentsService.webhook(
                payload,
                signature,
        );

}
}
