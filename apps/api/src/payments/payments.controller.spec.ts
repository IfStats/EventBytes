
import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

describe("PaymentsController", () => {
  let controller: PaymentsController;

  const paymentsServiceMock = {
    initialize: jest.fn(),
    verify: jest.fn(),
    webhook: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [PaymentsController],
        providers: [
          {
            provide: PaymentsService,
            useValue: paymentsServiceMock,
          },
        ],
      }).compile();

    controller = module.get(PaymentsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("passes payment verification to the service", async () => {
    const expected = {
      message: "Payment verified",
    };

    paymentsServiceMock.verify.mockResolvedValue(
      expected,
    );
const request = {
  user: { id: "user_1" },
} as Parameters<PaymentsController["verify"]>[1];

await expect(
  controller.verify("payment_ref_1", request),
).resolves.toEqual(expected);

expect(paymentsServiceMock.verify).toHaveBeenCalledWith(
  "payment_ref_1",
  "user_1",
);

  });
});
