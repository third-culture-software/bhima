angular.module('bhima.controllers')
  .controller('IndicatorDetailsModalController', IndicatorDetailsModalController);

IndicatorDetailsModalController.$inject = [
  'data', '$uibModalInstance', '$timeout', 'moment',
];

function IndicatorDetailsModalController(Data, Instance, $timeout, moment) {
  /* global muze */
  const { DataModel, layerFactory } = muze;
  const vm = this;

  vm.params = Data;
  vm.close = Instance.close;

  function orderPeriods(periodicValues) {
    return (periodicValues || []).sort(compare);
  }

  function compare(_a, _b) {
    const a = new Date(_a.period);
    const b = new Date(_b.period);
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  }

  function formatData(row) {
    row.minimum = Data.minValue || 0;
    row.maximum = Data.maxValue || 0;
    row['Period Name'] = moment(row.period).format('MMMM YYYY');
    return row;
  }

  function drawChart() {
    const unorderedData = orderPeriods(vm.params.periodicValues);
    const data = unorderedData.map(formatData);
    const schema = [
      { name : 'value', type : 'measure' },
      { name : 'minimum', type : 'measure', defAggFn : 'max' },
      { name : 'maximum', type : 'measure', defAggFn : 'min' },
      { name : 'Period Name' },
    ];

    const dm = new DataModel(data, schema);
    const env = muze(); // Initialize the Muze environment
    const canvas = env.canvas(); // Create a container canvas

    $timeout(() => {
      const layers = [{ mark : 'bar' }];
      const transforms = {};

      if (vm.params.value) {
        createChartLayer(
          'referenceLine', 'averageLine', 'calulatedAverage', 'averageText', 'calulatedAverage',
        );
        layers.push({
          mark : 'referenceLine',
          encoding : {
            text : {
              field : 'value',
              formatter : value => `Average : ${Number(value).toFixed(2)}`,
            },
          },
        });
        transforms.calulatedAverage = (dt) => dt.groupBy([''], { value : 'avg' });
      }

      canvas
        .data(dm)
        .rows(['value'])
        .columns(['Period Name'])
        .transform(transforms)
        .layers(layers)
        .width(700) // Specify width of visualization (canvas) in pixels
        .height(400) // Specify height of visualization (canvas) in pixels
        .mount('#indicator-chart');
    }, 0);
  }

  /**
   * Add a layer in the chart
   * @source : https://www.charts.com/muze/docs/Trendlines#implicit-encoding-and-resolving-encoding-for-composed-layer
   */
  function createChartLayer(
    name, nameOfLine, sourceOfLine, nameOfText, sourceOfText, color,
  ) {
    layerFactory.composeLayers(`${name}` /* name of composite layer */, [
      {
        name : nameOfLine, // Name of the line layer only
        mark : 'tick', // Defines what kind of plot to be used
        source : sourceOfLine, // Defines datasource from which it gets the data
        className : 'average-line', // CSS class name which the layer appends on group
        encoding : {
          y : `${name}.encoding.y`,
          color : { value : () => color || '#414141' },
        },
        calculateDomain : false, // Dont calculate domain of axis from this layer
      },
      {
        name : nameOfText,
        mark : 'text',
        source : sourceOfText,
        className : 'average-text',
        encoding : {
          y : `${name}.encoding.y`,
          text : `${name}.encoding.text`,
          color : { value : () => color || '#414141' },
        },
        encodingTransform : (points, layer, dependencies) => { /* Use this to change text position */
          const { width } = layer.measurement();
          const { smartLabel } = dependencies;
          for (let i = 0; i < points.length; i++) {
            const size = smartLabel.getOriSize(points[i].text);
            points[i].update.x = width - 5;
            points[i].textanchor = 'end';
            points[i].update.y -= size.height / 2;
          }
          return points;
        },
        calculateDomain : false, /* No calculation of domain from this layer */
      },
    ]);
  }

  drawChart();
}
