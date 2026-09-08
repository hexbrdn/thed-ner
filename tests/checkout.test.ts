import { describe, expect, it } from "vitest";
import {
  EMPTY_CHECKOUT_FORM,
  toCreateOrderInput,
  validateCheckoutForm,
  type CheckoutFormValues,
} from "@/lib/checkout/validate";
import { createOrderSchema, deliveryAddressSchema } from "@/lib/orders/schema";

/**
 * Ödeme formu doğrulaması.
 *
 * Buradaki asıl sınav "istemci doğru mu" değil, **istemci ile sunucu aynı şeyi
 * mi söylüyor**. İkisi ayrışırsa müşteri, sunucunun reddedeceği bir formu
 * "geçerli" görür ve hatayı ancak ödeme adımında öğrenir. Bu yüzden testlerin
 * bir kısmı aynı girdiyi hem `validateCheckoutForm`'a hem `createOrderSchema`'ya
 * verip iki tarafın kararını karşılaştırıyor.
 */

const messages = {
  name: "ad",
  phone: "telefon",
  email: "eposta",
  street: "sokak",
  houseNo: "no",
  zip: "plz",
  city: "sehir",
};

function form(overrides: Partial<CheckoutFormValues> = {}): CheckoutFormValues {
  return {
    ...EMPTY_CHECKOUT_FORM,
    name: "Ayşe Yılmaz",
    phone: "0176 1234567",
    street: "Straubinger Str.",
    houseNo: "3",
    ...overrides,
  };
}

const validate = (values: CheckoutFormValues, extra: { zip?: string; city?: string } = {}) =>
  validateCheckoutForm({
    values,
    fulfillment: "DELIVERY",
    zip: extra.zip ?? "94342",
    city: extra.city ?? "Straßkirchen",
    messages,
  });

describe("ödeme formu doğrulaması", () => {
  it("eksiksiz teslimat formunu kabul eder", () => {
    expect(validate(form())).toEqual({});
  });

  it("kat ve zil ismi boş olabilir — ikisi de isteğe bağlı", () => {
    expect(validate(form({ floor: "", bellName: "" }))).toEqual({});
  });

  it("tek harflik adı reddeder", () => {
    expect(validate(form({ name: "A" })).name).toBe(messages.name);
  });

  it("boşluktan ibaret adı reddeder", () => {
    expect(validate(form({ name: "    " })).name).toBe(messages.name);
  });

  it("kısa ve harf içeren telefonu reddeder", () => {
    expect(validate(form({ phone: "0176" })).phone).toBe(messages.phone);
    expect(validate(form({ phone: "sıfır yüz yetmiş" })).phone).toBe(messages.phone);
  });

  it("boşluk, parantez ve + içeren telefonu kabul eder", () => {
    expect(validate(form({ phone: "+49 (9424) 39093" })).phone).toBeUndefined();
  });

  it("e-posta boşsa hata vermez, doluysa denetler", () => {
    expect(validate(form({ email: "" })).email).toBeUndefined();
    expect(validate(form({ email: "ayse@example.com" })).email).toBeUndefined();
    expect(validate(form({ email: "ayse@" })).email).toBe(messages.email);
    expect(validate(form({ email: "ayse.example.com" })).email).toBe(messages.email);
    expect(validate(form({ email: "a@b@c.com" })).email).toBe(messages.email);
  });

  it("artı etiketli adresi reddetmez (geçerli ama sıra dışı)", () => {
    expect(validate(form({ email: "ayse+siparis@example.co.uk" })).email).toBeUndefined();
  });

  it("beş haneli olmayan posta kodunu reddeder", () => {
    expect(validate(form(), { zip: "9434" }).zip).toBe(messages.zip);
    expect(validate(form(), { zip: "" }).zip).toBe(messages.zip);
  });

  it("gel-alda adres alanlarını hiç sormaz", () => {
    const errors = validateCheckoutForm({
      values: { ...EMPTY_CHECKOUT_FORM, name: "Ayşe Yılmaz", phone: "0176 1234567" },
      fulfillment: "PICKUP",
      zip: "",
      city: "",
      messages,
    });
    expect(errors).toEqual({});
  });
});

describe("istemci ile sunucu kuralları ayrışmıyor", () => {
  const lines = [{ kind: "product" as const, productId: "p1", qty: 1 }];

  it("istemcinin kabul ettiği form sunucudan da geçer", () => {
    const values = form({ email: "ayse@example.com", floor: "3. OG", bellName: "Yılmaz" });
    expect(validate(values)).toEqual({});

    const parsed = createOrderSchema.safeParse(
      toCreateOrderInput({
        lines,
        lang: "de",
        fulfillment: "DELIVERY",
        values,
        zip: "94342",
        city: "Straßkirchen",
      })
    );
    expect(parsed.success).toBe(true);
  });

  it("istemcinin reddettiği telefonu sunucu da reddeder", () => {
    const values = form({ phone: "0176" });
    expect(validate(values).phone).toBe(messages.phone);

    const parsed = createOrderSchema.safeParse(
      toCreateOrderInput({
        lines,
        lang: "de",
        fulfillment: "DELIVERY",
        values,
        zip: "94342",
        city: "Straßkirchen",
      })
    );
    expect(parsed.success).toBe(false);
  });

  it("gel-alda adres gövdeye hiç eklenmez", () => {
    const body = toCreateOrderInput({
      lines,
      lang: "de",
      fulfillment: "PICKUP",
      values: form(),
      zip: "94342",
      city: "Straßkirchen",
    });
    expect(body).not.toHaveProperty("address");
    expect(createOrderSchema.safeParse(body).success).toBe(true);
  });

  it("gövde alanları kırpılır — kurye kapıda boşluk okumaz", () => {
    const body = toCreateOrderInput({
      lines,
      lang: "de",
      fulfillment: "DELIVERY",
      values: form({ floor: "  3. OG links  ", bellName: "  Yılmaz  " }),
      zip: "94342",
      city: "  Straßkirchen  ",
    });
    expect(body.address?.floor).toBe("3. OG links");
    expect(body.address?.bellName).toBe("Yılmaz");
    expect(body.address?.city).toBe("Straßkirchen");
  });

  it("gövdeye fiyat alanı eklenmez", () => {
    const body = toCreateOrderInput({
      lines,
      lang: "de",
      fulfillment: "DELIVERY",
      values: form(),
      zip: "94342",
      city: "Straßkirchen",
    });
    expect(JSON.stringify(body)).not.toMatch(/price|total|cents/i);
  });
});

describe("teslimat adresi şeması", () => {
  it("kat ve zil ismi verilmezse boş dizeye düşer", () => {
    const parsed = deliveryAddressSchema.parse({
      street: "Straubinger Str.",
      houseNo: "3",
      zip: "94342",
      city: "Straßkirchen",
    });
    expect(parsed.floor).toBe("");
    expect(parsed.bellName).toBe("");
  });

  it("aşırı uzun zil ismini reddeder", () => {
    const result = deliveryAddressSchema.safeParse({
      street: "Straubinger Str.",
      houseNo: "3",
      bellName: "x".repeat(81),
      zip: "94342",
      city: "Straßkirchen",
    });
    expect(result.success).toBe(false);
  });
});
