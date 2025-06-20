// API /referenceLookup/:codeRef/:language

// module dependencies
const db = require('./db');
const identifiers = require('../config/identifiers');
const BadRequest = require('./errors/BadRequest');

exports.getEntity = getEntity;

// loading identifiers keys, used for defining the table name
const identifiersIndex = {};
indexIdentifiers();

// This function will render a report in the browser
// It searches for a saved entity
// It requires a reference code and language as parameters
// The reference code is a combination of table_key.project_abbr.reference
// The table name is variable, it can be invoice, cash, voucher,
// stock movements, employees.
async function getEntity(req, res) {
  const { language } = req.params;
  const [code, projectName, reference] = req.params.codeRef.split('.');

  const documentDefinition = identifiersIndex[code];

  // handle stock movement reference
  const STOCK_MOVEMENT_PREFIX = 'SM';

  // handle employee reference
  const EMPLOYEE_PREFIX = 'EM';

  const isStockMovement = (code === STOCK_MOVEMENT_PREFIX);
  const isEmployee = (code === EMPLOYEE_PREFIX);

  // consider corner cases to guard against infinite redirects
  if (!documentDefinition) {
    throw new BadRequest(`Invalid document type provided - '${code}'`);
  }

  if (!documentDefinition.documentPath) {
    throw new BadRequest(`Document type does not support document path - '${code}'`);
  }

  let url;

  // render a stock movement receipt
  if (isStockMovement) {
    const queryDocument = `SELECT BUID(uuid) as uuid FROM document_map WHERE text = ?`;
    const { uuid } = await db.one(queryDocument, [req.params.codeRef]);
    url = `${documentDefinition.documentPath}${uuid}?lang=${language}&renderer=pdf`;

    // render the employee card
  } else if (isEmployee) {
    const queryEntity = `
        SELECT BUID(employee.uuid) AS uuid
        FROM entity_map
          JOIN employee ON employee.creditor_uuid = entity_map.uuid
        WHERE entity_map.text = ?
      `;

    const { uuid } = await db.one(queryEntity, [req.params.codeRef]);
    url = `${documentDefinition.documentPath}?lang=${language}&renderer=pdf&employee_uuid=${uuid}`;

    // render a regular document type
  } else {
    const query = `
        SELECT BUID(uuid) as uuid
        FROM ${documentDefinition.table} as documentTable JOIN project ON documentTable.project_id = project.id
        WHERE project.abbr = ? AND documentTable.reference = ?
      `;

    // search for full UUID
    const { uuid } = await db.one(query, [projectName, reference]);
    url = `${documentDefinition.documentPath}${uuid}?lang=${language}&renderer=pdf`;
  }

  res.redirect(url);
}

function indexIdentifiers() {
  Object.values(identifiers).forEach(entity => {
    identifiersIndex[entity.key] = entity;
  });
}
