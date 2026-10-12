
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Headers,
  UseGuards,
} from "@nestjs/common";

import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";

import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post("initialize")
  @UseGuards(JwtAuthGuard)
  initialize(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initialize(
      req.user.id,
      dto.registrationId,
    );
  }
@Get("verify/:reference")
@UseGuards(JwtAuthGuard)
verify(
  @Param("reference") reference: string,
  @Req() req: Request & { user: { id: string } },
) {
  return this.paymentsService.verify(
    reference,
    req.user.id,
  );
}


  @Post("webhook")
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: unknown,
    @Headers("x-paystack-signature") signature?: string,
  ) {
    return this.paymentsService.webhook(
      payload,
      signature,
      req.rawBody,
    );
  }
}