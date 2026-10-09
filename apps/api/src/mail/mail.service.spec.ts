
import { Test, TestingModule } from "@nestjs/testing";
import { MailService } from "./mail.service";

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        data: {
          id: "test_email_1",
        },
        error: null,
      }),
    },
  })),
}));

describe("MailService", () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [MailService],
      }).compile();

    service = module.get(MailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("sends a ticket using the mocked email provider", async () => {
    const result = await service.sendTicket(
      "attendee@example.com",
      {
        ticketNumber: "EVT-001",
        qrCode: "data:image/png;base64,test",
      },
      {
        name: "EventBytes Conference",
      },
    );

    expect(result).toEqual({
      data: {
        id: "test_email_1",
      },
      error: null,
    });
  });
});
