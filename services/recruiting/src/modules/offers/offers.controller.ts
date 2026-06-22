import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OfferResponse } from '@wr/contracts';
import { OfferLetterService } from './offer-letter.service';

@Controller()
export class OffersController {
  constructor(private readonly service: OfferLetterService) {}

  @MessagePattern('recruiting.offers.generate')
  generate(
    @Payload()
    payload: {
      requestId: string;
      candidateId: string;
      compensation: string;
      startDate: string;
      generatedById: string;
    },
  ) {
    const { requestId, generatedById, ...offerDetails } = payload;
    return this.service.generate(requestId, offerDetails, generatedById);
  }

  @MessagePattern('recruiting.offers.get')
  get(@Payload() payload: { id: string; actorUserId?: string; actorRole?: string }) {
    return this.service.get(payload.id, payload.actorUserId, payload.actorRole);
  }

  @MessagePattern('recruiting.offers.send')
  send(@Payload() payload: { id: string; sentById: string }) {
    return this.service.send(payload.id, payload.sentById);
  }

  @MessagePattern('recruiting.offers.respond')
  respond(
    @Payload()
    payload: {
      id: string;
      response: OfferResponse;
      note?: string;
      candidateUserId: string;
    },
  ) {
    return this.service.respond(
      payload.id,
      payload.response,
      payload.candidateUserId,
      payload.note,
    );
  }
}
