import React from 'react';
import {PivotData} from './Utilities';

function makeRenderer(
  PlotlyComponent,
  traceOptions = {},
  layoutOptions = {},
  transpose = false
) {
  class Renderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props);
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      const traceKeys = transpose ? colKeys : rowKeys;
      if (traceKeys.length === 0) {
        traceKeys.push([]);
      }
      const datumKeys = transpose ? rowKeys : colKeys;
      if (datumKeys.length === 0) {
        datumKeys.push([]);
      }

      let fullAggName = this.props.aggregatorName;
      const numInputs =
        this.props.aggregators[fullAggName]([])().numInputs || 0;
      if (numInputs !== 0) {
        fullAggName += ` of ${this.props.vals.slice(0, numInputs).join(', ')}`;
      }

      const data = traceKeys.map(traceKey => {
        const values = [];
        const labels = [];
        for (const datumKey of datumKeys) {
          const val = parseFloat(
            pivotData
              .getAggregator(
                transpose ? datumKey : traceKey,
                transpose ? traceKey : datumKey
              )
              .value()
          );
          values.push(isFinite(val) ? val : null);
          labels.push(datumKey.join('-') || ' ');
        }
        const trace = {name: traceKey.join('-') || fullAggName};
        trace.x = transpose ? values : labels;
        trace.y = transpose ? labels : values;
        if (traceOptions.type == "pie") {
          trace.values = values
          trace.labels = labels
        }

        return Object.assign(trace, traceOptions);
      });

      let titleText = fullAggName;
      const hAxisTitle = transpose
        ? this.props.rows.join('-')
        : this.props.cols.join('-');
      const groupByTitle = transpose
        ? this.props.cols.join('-')
        : this.props.rows.join('-');
      if (hAxisTitle !== '') {
        titleText += ` vs ${hAxisTitle}`;
      }
      if (groupByTitle !== '') {
        titleText += ` by ${groupByTitle}`;
      }

      const layout = {
        title: titleText,
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
        xaxis: {
          title: transpose ? fullAggName : null,
          automargin: true,
        },
        yaxis: {
          title: transpose ? null : fullAggName,
          automargin: true,
        },
      };

      return (
        <PlotlyComponent
          data={data}
          layout={Object.assign(
            layout,
            layoutOptions,
            this.props.plotlyOptions
          )}
        />
      );
    }
  }

  Renderer.defaultProps = PivotData.defaultProps;
  Renderer.propTypes = PivotData.propTypes;

  return Renderer;
}

function makeScatterRenderer(PlotlyComponent) {
  class Renderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props);
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      if (rowKeys.length === 0) {
        rowKeys.push([]);
      }
      if (colKeys.length === 0) {
        colKeys.push([]);
      }

      const data = {x: [], y: [], text: [], type: 'scatter', mode: 'markers'};

      rowKeys.map(rowKey => {
        colKeys.map(colKey => {
          const v = pivotData.getAggregator(rowKey, colKey).value();
          if (v !== null) {
            data.x.push(colKey.join('-'));
            data.y.push(rowKey.join('-'));
            data.text.push(v);
          }
        });
      });

      const layout = {
        title: this.props.rows.join('-') + ' vs ' + this.props.cols.join('-'),
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        xaxis: {title: this.props.cols.join('-'), domain: [0.1, 1.0]},
        yaxis: {title: this.props.rows.join('-')},
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      };

      return (
        <PlotlyComponent
          data={[data]}
          layout={Object.assign(layout, this.props.plotlyOptions)}
        />
      );
    }
  }

  Renderer.defaultProps = PivotData.defaultProps;
  Renderer.propTypes = PivotData.propTypes;

  return Renderer;
}


function makePieRenderer(PlotlyComponent) {
  class Renderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props);
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      if (rowKeys.length === 0) {
        rowKeys.push([]);
      }
      if (colKeys.length === 0) {
        colKeys.push([]);
      }

      const data = {labels: [], values: [], text: [], type: 'pie', mode: 'markers'};

      rowKeys.map(rowKey => {
        colKeys.map(colKey => {
          const v = pivotData.getAggregator(rowKey, colKey).value();
          if (v !== null) {
            data.values.push(colKey.join('-'));
            data.labels.push(colKey.join('-'));
            data.text.push(v);
          }
        });
      });

      const layout = {
        title: this.props.rows.join('-') + ' vs ' + this.props.cols.join('-'),
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        xaxis: {title: this.props.cols.join('-'), domain: [0.1, 1.0]},
        yaxis: {title: this.props.rows.join('-')},
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      };

      return (
        <PlotlyComponent
          data={[data]}
          layout={Object.assign(layout, this.props.plotlyOptions)}
        />
      );
    }
  }

  Renderer.defaultProps = PivotData.defaultProps;
  Renderer.propTypes = PivotData.propTypes;

  return Renderer;
}

export default function createPlotlyRenderers(PlotlyComponent) {
  return {
    'Grouped Column Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar'},
      {barmode: 'group'}
    ),
    'Stacked Column Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar'},
      {barmode: 'stack'}
    ),
    'Grouped Bar Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar', orientation: 'h'},
      {barmode: 'group'},
      true
    ),
    'Stacked Bar Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar', orientation: 'h'},
      {barmode: 'stack'},
      true
    ),
    'Pie Chart':  makeRenderer(
      PlotlyComponent,
      {type: 'pie', mode: 'markers'},
      {}
    ),
    'Line Chart': makeRenderer(PlotlyComponent),
    'Dot Chart': makeRenderer(PlotlyComponent, {mode: 'markers'}, {}, true),
    'Scatter Chart': makeScatterRenderer(PlotlyComponent),
  };
}
