import { describe, expect, it } from "vitest";
import {
  ACTIVE_STATUSES,
  canTransition,
  isTerminal,
  needsRefund,
  nextStatuses,
  progressIndex,
  progressSteps,
  STATUS_LABELS,
} from "@/lib/orders/status";
import type { OrderStatus } from "@prisma/client";

/**
 * Sipariş durum makinesi.
 *
 * Panelde iki kez tıklanan bir düğme ya da eskimiş bir görünüm, siparişi
 * tutarsız bir duruma sokamamalı. Bu testler "hangi geçişe izin veriliyor"dan
 * çok "hangisine izin VERİLMİYOR"u sabitler.
 */

describe("izin verilen geçişler", () => {
  it("ödeme akışını takip eder", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID", "DELIVERY")).toBe(true);
    expect(canTransition("PAID", "ACCEPTED", "DELIVERY")).toBe(true);
    expect(canTransition("ACCEPTED", "PREPARING", "DELIVERY")).toBe(true);
  });

  it("teslim biçimine göre daralır", () => {
    // Kurye siparişi "hazır"a değil "yolda"ya geçer; gel-al tam tersi.
    expect(canTransition("PREPARING", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(true);
    expect(canTransition("PREPARING", "READY", "DELIVERY")).toBe(false);

    expect(canTransition("PREPARING", "READY", "PICKUP")).toBe(true);
    expect(canTransition("PREPARING", "OUT_FOR_DELIVERY", "PICKUP")).toBe(false);
  });
});

describe("reddedilen geçişler", () => {
  it("ödeme alınmadan sipariş kabul edilemez", () => {
    // Mutfak, parası gelmemiş siparişi hazırlamaya başlayamamalı.
    expect(canTransition("PENDING_PAYMENT", "ACCEPTED", "DELIVERY")).toBe(false);
    expect(canTransition("PENDING_PAYMENT", "PREPARING", "DELIVERY")).toBe(false);
    expect(canTransition("PENDING_PAYMENT", "DELIVERED", "DELIVERY")).toBe(false);
  });

  it("geriye dönüş yoktur", () => {
    expect(canTransition("DELIVERED", "PREPARING", "DELIVERY")).toBe(false);
    expect(canTransition("PREPARING", "PAID", "DELIVERY")).toBe(false);
    expect(canTransition("PAID", "PENDING_PAYMENT", "DELIVERY")).toBe(false);
  });

  it("teslim edilmiş sipariş iptal edilemez", () => {
    // İptal, para iadesi tetikler; teslim edilmiş yemekte bu bir kayıptır.
    expect(canTransition("DELIVERED", "CANCELLED", "DELIVERY")).toBe(false);
    expect(canTransition("PICKED_UP", "CANCELLED", "PICKUP")).toBe(false);
  });

  it("yolа çıkmış sipariş iptal edilemez", () => {
    expect(canTransition("OUT_FOR_DELIVERY", "CANCELLED", "DELIVERY")).toBe(false);
  });

  it("süresi dolmuş sipariş canlandırılamaz", () => {
    expect(canTransition("EXPIRED", "PAID", "DELIVERY")).toBe(false);
    expect(canTransition("CANCELLED", "PAID", "DELIVERY")).toBe(false);
    expect(canTransition("REJECTED", "ACCEPTED", "DELIVERY")).toBe(false);
  });
});

describe("uç durumlar", () => {
  const terminal: OrderStatus[] = [
    "DELIVERED",
    "PICKED_UP",
    "CANCELLED",
    "REJECTED",
    "EXPIRED",
  ];

  it("uç durumdan çıkış yoktur", () => {
    for (const status of terminal) {
      expect(isTerminal(status)).toBe(true);
      expect(nextStatuses(status, "DELIVERY")).toHaveLength(0);
      expect(nextStatuses(status, "PICKUP")).toHaveLength(0);
    }
  });

  it("akıştaki durumlar uç değildir", () => {
    for (const status of ACTIVE_STATUSES) {
      if (status === "READY" || status === "OUT_FOR_DELIVERY") continue;
      expect(isTerminal(status)).toBe(false);
    }
  });
});

describe("iade gerekliliği", () => {
  it("para alınmamış siparişte iade gerekmez", () => {
    expect(needsRefund("PENDING_PAYMENT")).toBe(false);
    expect(needsRefund("EXPIRED")).toBe(false);
  });

  it("para alınmış siparişin iptalinde iade gerekir", () => {
    expect(needsRefund("PAID")).toBe(true);
    expect(needsRefund("PREPARING")).toBe(true);
  });
});

describe("müşteri ilerleme çubuğu", () => {
  it("teslim biçimine göre farklı adımlar gösterir", () => {
    expect(progressSteps("DELIVERY")).toContain("OUT_FOR_DELIVERY");
    expect(progressSteps("DELIVERY")).not.toContain("READY");
    expect(progressSteps("PICKUP")).toContain("READY");
    expect(progressSteps("PICKUP")).not.toContain("OUT_FOR_DELIVERY");
  });

  it("iptal/ret çubukta yer almaz", () => {
    // Bunlar ayrı bir uyarı olarak gösterilir; ilerleme çizgisine karışmaz.
    for (const fulfillment of ["DELIVERY", "PICKUP"] as const) {
      expect(progressIndex("CANCELLED", fulfillment)).toBe(-1);
      expect(progressIndex("REJECTED", fulfillment)).toBe(-1);
      expect(progressIndex("EXPIRED", fulfillment)).toBe(-1);
    }
  });

  it("adım sırası ilerler", () => {
    expect(progressIndex("PAID", "DELIVERY")).toBe(0);
    expect(progressIndex("DELIVERED", "DELIVERY")).toBe(4);
  });
});

describe("durum etiketleri", () => {
  it("her durumun iki dilde karşılığı vardır", () => {
    // Eksik bir etiket müşteriye "undefined" göstermek demektir.
    for (const [status, labels] of Object.entries(STATUS_LABELS)) {
      expect(labels.de.length, `${status}.de`).toBeGreaterThan(0);
      expect(labels.tr.length, `${status}.tr`).toBeGreaterThan(0);
    }
  });
});
