import { expect } from "@playwright/test";
import { test } from '@/helpers/fixtures/fixture.js'

// TODO  27.07 флаки, разобраться
test('Номенклатуры: перемещение номенклатуры в списке', async ({ adminApp }) => {
  await adminApp.openNomenclaturesPage();
  await adminApp.nomenclaturesPage.selectServicesGroup();

  const movedNomenclatureId = await adminApp.nomenclaturesPage.getNomenclatureIdByIndex(0);

  await adminApp.nomenclaturesPage.moveNomenclatureByIndex(0, 1);
  await expect.poll(async () => (
    await adminApp.nomenclaturesPage.getNomenclatureIndexById(movedNomenclatureId)
  )).toBeGreaterThan(0);

  const movedNomenclatureIndex = await adminApp.nomenclaturesPage.getNomenclatureIndexById(movedNomenclatureId);

  await adminApp.nomenclaturesPage.moveNomenclatureByIndex(movedNomenclatureIndex, 0);
  await expect.poll(async () => (
    await adminApp.nomenclaturesPage.getNomenclatureIdByIndex(0)
  )).toBe(movedNomenclatureId);
});
