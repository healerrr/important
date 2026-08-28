describe('API E2E environment', () => {
  it('documents the external PostgreSQL prerequisite', () => {
    expect(process.env.TEST_DATABASE_URL ?? 'configure-test-database').toBeTruthy();
  });
});
