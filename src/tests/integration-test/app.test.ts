import request from "supertest";
import app from "../../index.js";

describe("Root API Test", () => {
  it("doit répondre que l'API est en cours d'exécution", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("API Ressource Backend est en cours d'exécution");
  });
});
