const {
  ReportManager,
  db, barcode, identifiers,
  Shipment, ShipmentContainer,
  SHIPMENT_DOCUMENT_TEMPLATE,
  SHIPMENT_GOODS_RECEIVED_NOTE_TEMPLATE,
  SHIPMENT_MANIFEST_TEMPLATE,
} = require('./common');

function sortItems(items) {
  items.sort((a, b) => {
    const atext = a.inventory_label.toLowerCase();
    const btext = b.inventory_label.toLowerCase();
    return atext.localeCompare(btext);
  });
}

async function getShipmentDocument(req, res) {
  const { uuid } = req.params;
  let title = 'SHIPMENT.TITLE';
  let template = SHIPMENT_DOCUMENT_TEMPLATE;
  if (req.query.manifest) {
    title = 'SHIPMENT.SHIPMENT_MANIFEST';
    template = SHIPMENT_MANIFEST_TEMPLATE;
  } else if (req.query.goodsReceived) {
    title = 'SHIPMENT.GOODS_RECEIVED_NOTE';
    template = SHIPMENT_GOODS_RECEIVED_NOTE_TEMPLATE;
  }
  const options = {
    ...req.query,
    filename : title,
    // 'format' defaults to A4
    orientation : 'portrait',
  };

  const report = new ReportManager(template, req.session, options);
  const shipment = await Shipment.lookupSingle(uuid);
  const shipmentItems = await Shipment.getPackingList(uuid);
  const containers = await ShipmentContainer.containersForShipment(uuid);

  const depotSql = `
    SELECT
      BUID(d.uuid) as uuid, d.text, d.description, d.is_warehouse,
      BUID(d.location_uuid) AS location_uuid,
      v.name as village_name, s.name as sector_name,
      p.name as province_name, c.name as country_name
    FROM depot AS d
      LEFT JOIN village v ON v.uuid = d.location_uuid
      LEFT JOIN sector s ON s.uuid = v.sector_uuid
      LEFT JOIN province p ON p.uuid = s.province_uuid
      LEFT JOIN country c ON c.uuid = p.country_uuid
    WHERE d.uuid = ?;
  `;

  // Get the depot info
  const [originDepot] = await db.exec(depotSql, [db.bid(shipment.origin_depot_uuid)]);
  const odes = originDepot.description;
  if (typeof odes === 'string') {
    originDepot.description = odes.split('\n');
  }
  shipment.origin_depot = originDepot;

  const [destinationDepot] = await db.exec(depotSql, [db.bid(shipment.destination_depot_uuid)]);
  const ddes = destinationDepot.description;
  if (typeof ddes === 'string') {
    destinationDepot.description = ddes.split('\n');
  }
  shipment.destination_depot = destinationDepot;

  // Compute totals and fix units
  shipmentItems.forEach(row => {
    row.cost = row.quantity_sent * row.unit_price;
    row.weight = row.quantity_sent * row.unit_weight;
  });

  shipment.barcode = barcode.generate(identifiers.SHIPMENT.key, shipment.uuid);

  shipment.totalNumItems = shipmentItems.length;

  shipment.totalCost = shipmentItems.reduce((agg, row) => agg + row.cost, 0);
  shipment.totalQuantity = shipmentItems.reduce((agg, row) => agg + row.quantity_sent, 0);
  shipment.totalWeight = shipmentItems.reduce((agg, row) => agg + row.weight, 0);

  shipment.hasContainers = containers.length > 0;
  shipment.numContainers = containers.length;
  shipment.multipleContainers = containers.length > 1;
  shipment.multipleContainerLabel = shipment.multipleContainers ? 'SHIPMENT.CONTAINERS' : 'SHIPMENT.CONTAINER';

  // Construct the contents list for display
  let contents = [];
  let itemNum = 1;

  // helper function for rounding to artibrary precision
  const round = (num, decimals) => Number((num).toPrecision(decimals));

  if (shipment.hasContainers) {
    const data = Object.groupBy(shipmentItems, x => x.container_label);
    containers.forEach(cntr => {
      const containerItems = data[cntr.label];
      sortItems(containerItems);
      containerItems.forEach(item => {
        item.num = itemNum++;
        if (item.is_asset) {
          item.lot_label = `${item.lot_label} / ${item.serial_number}`;
        }
      });
      contents.push({
        containerName : cntr.label,
        containerDescription : cntr.description,
        containerEmptyWeight : round(cntr.weight, 2),
        containerType : `SHIPMENT.CONTAINER_TYPES.${cntr.container_type}`,
        containerWeight : round(cntr.weight + containerItems.reduce((agg, row) => agg + row.weight, 0), 2),
        containerValue : containerItems.reduce((agg, row) => agg + row.cost, 0),
        items : containerItems,
      });
      shipment.totalWeight += cntr.weight;
    });

    // Round weights for display
    shipment.totalWeight = round(shipment.totalWeight, 2);
    shipmentItems.forEach(row => {
      row.weight = round(row.quantity_sent * row.unit_weight, 2);
      row.unit_weight = round(row.unit_weight, 2);
    });
  } else {
    sortItems(shipmentItems);
    shipmentItems.forEach(item => {
      item.num = ++itemNum;
      if (item.is_asset) {
        item.lot_label = `${item.lot_label} / ${item.serial_number}`;
      }
    });
    contents = [{
      containerName : null,
      items : shipmentItems,
    }];
  }

  const data = {
    shipment,
    contents,
    date : new Date(),
  };

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.getShipmentDocument = getShipmentDocument;
