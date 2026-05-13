const TU = require('../shared/TestUtils');
const components = require('../shared/components');

const GridRow = require('../shared/GridRow');

/**
 * This class is represents a entity page in term of structure and
 * behavior so it is a entity page object.
 */
class EntityPage {
  constructor() {
    this.gridId = 'entity-grid';
  }

  /**
   * create an entity
   * @param name
   * @param type
   * @param gender
   * @param phone
   * @param email
   * @param address
   */
  async createEntity(name, type, gender, phone, email, address) {
    await TU.buttons.create();
    // entity name
    await TU.input('EntityModalCtrl.entity.display_name', name);

    // entity type
    await components.entityTypeSelect.set(type);

    // entity gender
    await components.genderSelect.set(gender);

    // entity phone
    await TU.input('EntityModalCtrl.entity.phone', phone);

    // entity email
    await TU.input('EntityModalCtrl.entity.email', email);

    // entity address
    await TU.input('EntityModalCtrl.entity.address', address);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the edit link of a entity
   * @param name
   * @param newName
   * @param type
   * @param gender
   * @param phone
   * @param email
   * @param address
   */
  async editEntity(name, newName, type, gender, phone, email, address) {
    const row = new GridRow(name);

    await row.dropdown();
    await row.edit();

    if (newName) {
      await TU.input('EntityModalCtrl.entity.display_name', newName);
    }

    if (type) {
      await components.entityTypeSelect.set(type);
    }

    if (gender) {
      await components.genderSelect.set(gender);
    }

    if (phone) {
      await TU.input('EntityModalCtrl.entity.phone', phone);
    }

    if (email) {
      await TU.input('EntityModalCtrl.entity.email', email);
    }

    if (address) {
      await TU.input('EntityModalCtrl.entity.address', address);
    }

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the entity name
   */
  async errorOnCreateEntity() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('EntityModalCtrl.entity.display_name');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the delete link of a entity
   * @param name
   */
  async deleteEntity(name) {
    const row = new GridRow(name);
    await row.dropdown();
    await row.remove();

    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }
}

module.exports = EntityPage;
