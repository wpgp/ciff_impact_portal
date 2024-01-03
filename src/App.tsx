import * as React from "react";
import * as JSURL from "jsurl";
import type { NavigateOptions } from "react-router-dom";
import { Routes, Route, Link, useSearchParams } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import parser from 'html-react-parser';
import table from './data/impact_table.json';
import { TheMap } from './Map';
import { columns, detailColumns, longColumns } from './config'
import { onlyUnique } from "./utils";

export default function App() {
  return (
    <div>
      <Routes>
        <Route index element={<MainApp />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </div>
  );
}

let countryName = {};
table.forEach((row) => {
  let ids = row['CountryID'].split(', ');
  let names = row['Country'].split(', ');
  ids.forEach((id, i) => countryName[id.toLowerCase()] = names[i]);
});

function useQueryParam<T>(
  key: string
): [T | undefined, (newQuery: T, options?: NavigateOptions) => void] {
  let [searchParams, setSearchParams] = useSearchParams();
  let paramValue = searchParams.get(key);

  let value = React.useMemo(() => JSURL.parse(paramValue), [paramValue]);
  
  let setValue = React.useCallback(
    (newValue: T, options?: NavigateOptions) => {
      let newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(key, JSURL.stringify(newValue));
      setSearchParams(newSearchParams, options);
    },
    [key, searchParams, setSearchParams]
  );

  return [value, setValue];
}

interface Filter {
  country: string;
  countries: string[];
  regions: string[];
  sector: string;
  population: string;
  outcome: string;
  status: string;
  id: number;
}

function MainApp() {
  let [filterParam, setFilterParam] = useQueryParam<Filter>("filterParam");
  if (!filterParam) {
    filterParam = { country:'all', countries:['all'], regions:[], sector:'all', population:'all', outcome:'all', status:'all' , id:0};
  }

  const filteredTable = React.useMemo(() => {
    return updateTable(filterParam)
  }, [filterParam])

  const filterPanel = React.useMemo(() => {
    return (
      <form>
        {Object.keys(columns).map((k) => {
          let options:string[] = [];
          filteredTable.forEach((row) => options.push(row[columns[k]].split(', ')));
          options = options.flat().filter(onlyUnique).sort();
          
          return (
            <div key={'select'+k} className="form-floating mb-1">
              <select id={k} name={k} className="form-select" onChange={handleChange} value={filterParam[k]}>
                <option value={'all'} key={'all'+k}></option>

                {options.map((x) => {
                  const val = x.replaceAll(' ','').toLowerCase();
                  return <option key={val} value={val}>{x}</option>
                })}
              </select>
              <label htmlFor={k}> {columns[k]} </label>
            </div>
          )
        })}
      </form>
    )
  }, [filterParam])

  const map = React.useMemo(() => {
    return <TheMap filterParam_={filterParam} setState_={setFilterParam} filteredTable_={filteredTable}/>
  }, [filterParam])

  function updateTable(filterParam_:object){
    return table.filter((row) => {
      let yes = true;
      
      Object.keys(columns).forEach((k) => {
        const included = row[columns[k]].replaceAll(' ','').toLowerCase().split(',').includes(filterParam_[k]);
        const add = filterParam_[k] === 'all' ? true : included;
        yes = yes && add;
      })
      return yes;
    })
  }

  function showMulti(countries){
    const c = countries.replaceAll(', ',',').toLowerCase();
    filterParam.countries = c;
    filterParam.id = 0;
    filterParam.regions = [];
    setFilterParam(filterParam, { replace: true });
  }
  
  function ActivityTable({ columns, data, func}) {
    return (
      <div id='activityTable'>
        <table className="table table-sm table-striped table-hover">
          <thead className="table-danger">
            <tr key="header">
              {Object.keys(columns).map((col) => <td key={'header'+col}><b>{columns[col]}</b></td>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row:object, i:number) => {
              return (
              <tr key={"row_"+i} title="Click to show details" style={{cursor:'pointer'}} onClick={() => {func(row['EvaluationID'])}}>
                {Object.keys(columns).map((col) => <td key={i+'_'+col}>
                  {row[columns[col]]}
                  </td>)}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    )
  }
  
  function DetailTable(data:object[], country:string, id:number) {
    const filteredData = data.filter((row) => row['EvaluationID'] === id)[0]
    let regions = filteredData['Region'];
    let gpsRemark = (filteredData['GPS'] === 'Yes') ? (<span style={{fontSize:'smaller'}}><br/>Geo-coordinates are available.</span>) : '';
    let multiCountry = (filteredData['Multi'] === 'Yes') ? (<span style={{fontSize:'smaller'}}><br/>This investment is implemented in <a href='' onClick={() => showMulti(filteredData['CountryID'])}>several countries</a>.</span>) : '';
    const linkAvail = (filteredData['Link'] !== '') ? (<>or refer to <a href={filteredData['Link']} target='_blank'>the associated publication</a></>) : (<></>);
    const dataAvail = (filteredData['Data Availability'] === 'Yes') ? (
      <tr>
        <td><b>Data Availability</b></td>
        <td>
          Send <a href="mailto:info@ciff.org?subject=Data%20Request" target="_blank">e-mail</a> to <a href="https://ciff.org/contact" target="_blank">CIFF</a> for requesting the data {linkAvail}.
      </td></tr>
      ) : ('');
    
    let regionContent = (<tr><td><b>Remark</b></td><td></td></tr>);
    if (regions !== ''){
      regions = JSON.parse(regions.replace(/'/g, '"'))[countryName[country]].join(', ');
      regionContent = (<tr><td><b>Region</b></td><td>{regions}{gpsRemark}</td></tr>)
    }
  
    return (
      <>
        <div className="title"><b>{filteredData['Investment Name']}</b></div>
        <div id="detailTable">
          <i>{filteredData['Proposed Public Title']}</i>
          {multiCountry}
        <table className="table table-sm table-striped">
          <tbody>
            {regionContent}
  
            {detailColumns.map((col, i) => {
              let content = filteredData[col]
              let elements = (
                  <tr key={'detail'+i}>
                    <td><b>{col}</b></td>
                    <td>{content}</td>
                  </tr>
                )
              return elements})}
            
            {dataAvail}

            {longColumns.map((col, i) => {
              let content = parser(filteredData[col])
              let elements = (
                    <tr key={'l'+i}><td colSpan={2}>
                      <b>{col}</b><br/>
                      {content}</td></tr>
                    )
              return (elements)})}
          </tbody>
        </table>
        </div>
      </>
    )
  }
  
  function handleChange(event: React.ChangeEvent<HTMLselectElement>){
    let form = event.currentTarget;    
    if (form.id == 'country') {
      filterParam['countries'] = [form.value];
      filterParam['regions'] = []
    } else {
      //filterParam['countries'] = ['all'];
      filterParam['regions'] = []
    }
    filterParam[form.id] = form.value;
    filterParam['id'] = 0;
    setFilterParam(filterParam, { replace: true });
  }

  function selectID(id:number){
    let regions = filteredTable.filter((row) => row.EvaluationID === id)[0]['Region'];
    
    if (regions !== ''){
      regions = JSON.parse(regions.replace(/'/g, '"'))[countryName[filterParam.country]];
      regions = regions.map((item) => item.replaceAll(' ',''));
      filterParam.regions = regions;
    } else {
      filterParam.regions = [];
    }

    filterParam.countries = [filterParam.country];
    filterParam.id = id;
    setFilterParam(filterParam, { replace: true });
  }

  return (
    <>
      <div className="main-content">
        {map}
      </div>

      <div className="panel-left">
        {filterPanel}

        <div>
          <div className="float-end m-0">
            <form action="/">
              <button type="submit" className="btn btn-sm btn-danger" title="Reset filter">Reset</button>
            </form>
          </div>
        </div>
      </div>

      <div className="panel-right" hidden={filterParam.country === 'all'}>
        <div className="row m-0 p-0">
          <div className="title"><h5>{countryName[filterParam.country]}</h5></div>
          <ActivityTable columns={{'sector':'Sector', 'name':'Investment Name'}} data={filteredTable} func={selectID}/>
        </div>

        <div className="row m-0 p-0 mt-2">
          {(filterParam.id === 0) ? '' : DetailTable(filteredTable, filterParam.country, filterParam.id)}
        </div>
      </div>
    </>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}