export class NomenclaturesPage {

  // страница Номенклатуры

  constructor(page) {
    this.page = page;
    this.testIdAttribute = 'data-testid';
    this.dragHandleSelector = 'svg[data-icon="grip-vertical"]';

    this.nomenclaturesList = page.getByTestId('nomenclatures-list');
    this.nomenclatureRows = page.locator('[data-testid^="nomenclature-table-row-"]');
    this.servicesGroup = page.getByTestId('nomenclatures-sidebar-group-services-group');
  }

  // выбрать группу services
  async selectServicesGroup() {
    await this.servicesGroup.click();
  }

  // получить id номенклатуры по индексу
  async getNomenclatureIdByIndex(index) {
    return await this.nomenclatureRows.nth(index).getAttribute(this.testIdAttribute);
  }

  // получить индекс номенклатуры по id
  async getNomenclatureIndexById(nomenclatureId) {
    return await this.nomenclatureRows.evaluateAll((rows, { testIdAttribute, rowId }) => (
      rows.findIndex((row) => row.getAttribute(testIdAttribute) === rowId)
    ), {
      testIdAttribute: this.testIdAttribute,
      rowId: nomenclatureId,
    });
  }

  // переместить номенклатуру по индексу
  async moveNomenclatureByIndex(fromIndex, toIndex) {
    const dragHandle = this.nomenclatureRows
      .nth(fromIndex)
      .locator(this.dragHandleSelector);
    const targetRow = this.nomenclatureRows.nth(toIndex);

    const dragHandleBox = await dragHandle.boundingBox();
    const targetRowBox = await targetRow.boundingBox();
    const targetY = fromIndex > toIndex
      ? targetRowBox.y - 2
      : targetRowBox.y + targetRowBox.height / 2;

    await this.page.mouse.move(
      dragHandleBox.x + dragHandleBox.width / 2,
      dragHandleBox.y + dragHandleBox.height / 2,
    );
    await this.page.mouse.down();

    await this.page.mouse.move(
      targetRowBox.x + targetRowBox.width / 2,
      targetY,
      { steps: 20 },
    );
    await this.page.mouse.up();
  }
}
