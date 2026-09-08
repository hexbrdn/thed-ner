import { describe, expect, it } from "vitest";
import {
  CANCEL_REASONS,
  adminCancelLabel,
  buildCancelReason,
  describeCancelReason,
  isCancelReasonId,
} from "@/lib/orders/cancelReasons";

/**
 * İptal sebebi, müşteriye gösterilen tek açıklamadır: yanlış çevrilmesi ya da
 * boş kalması, "siparişim neden iptal oldu" telefonuyla biter. Bu yüzden
 * kayıt biçimi ile gösterim arasındaki dönüşüm testli.
 */

describe("iptal sebebi — kayıt biçimi", () => {
  it("listedeki sebebi kimlik olarak saklar", () => {
    expect(buildCancelReason("OUT_OF_STOCK", "")).toBe("OUT_OF_STOCK");
  });

  it("tanımadığı kimliği reddeder", () => {
    expect(buildCancelReason("WHATEVER", "")).toBeNull();
    expect(buildCancelReason("", "")).toBeNull();
  });

  it("'diğer' seçildiğinde metni kaydeder", () => {
    expect(buildCancelReason("OTHER", "  Fırın bozuldu  ")).toBe("OTHER: Fırın bozuldu");
  });

  it("'diğer' seçilip metin yazılmadıysa sebep sayılmaz", () => {
    // Sebepsiz iptalin kapısı: boş bir "diğer" kabul edilseydi müşteriye
    // hiçbir açıklama gitmezdi.
    expect(buildCancelReason("OTHER", "")).toBeNull();
    expect(buildCancelReason("OTHER", "ok")).toBeNull();
  });
});

describe("iptal sebebi — gösterim", () => {
  it("kimliği müşterinin dilinde cümleye çevirir", () => {
    const reason = CANCEL_REASONS.find((entry) => entry.id === "TOO_BUSY")!;
    expect(describeCancelReason("TOO_BUSY", "de")).toBe(reason.de);
    expect(describeCancelReason("TOO_BUSY", "tr")).toBe(reason.tr);
  });

  it("bilinmeyen dilde Almancaya düşer", () => {
    const reason = CANCEL_REASONS.find((entry) => entry.id === "CLOSED")!;
    expect(describeCancelReason("CLOSED", "en")).toBe(reason.de);
  });

  it("'diğer' metnini olduğu gibi gösterir", () => {
    expect(describeCancelReason("OTHER: Fırın bozuldu", "de")).toBe("Fırın bozuldu");
  });

  it("bu sistemden önce yazılmış serbest metni korur", () => {
    // Eski kayıtlarda `cancelReason` düz metindi; "bilinmiyor" demek,
    // saklanmış bilgiyi çöpe atmak olurdu.
    expect(describeCancelReason("Kurye hastalandı", "tr")).toBe("Kurye hastalandı");
  });

  it("boş değerde null döner", () => {
    expect(describeCancelReason("", "tr")).toBeNull();
    expect(describeCancelReason(null, "tr")).toBeNull();
    expect(describeCancelReason(undefined, "tr")).toBeNull();
  });

  it("panelde kısa etiket gösterir", () => {
    expect(adminCancelLabel("OUT_OF_STOCK")).toBe("Ürün tükendi");
    expect(adminCancelLabel("OTHER: Fırın bozuldu")).toBe("Fırın bozuldu");
    expect(adminCancelLabel(null)).toBeNull();
  });
});

describe("kimlik denetimi", () => {
  it("listedeki her kimliği tanır", () => {
    for (const reason of CANCEL_REASONS) {
      expect(isCancelReasonId(reason.id)).toBe(true);
    }
  });

  it("uydurma kimliği tanımaz", () => {
    expect(isCancelReasonId("NOPE")).toBe(false);
  });
});
