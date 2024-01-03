export const columns = {
    'country':'Country', 'sector':'Sector', 'population':'Target Population', 
    'outcome':'Primary Outcome', 'status':'Status'}

export const detailColumns = ['Sector', 'Target Population', 'Primary Outcome',
    'Implementing Agency', 'Evaluation Agency', 'Years of Investment', 'Status']

export const longColumns = ['Programme Description', 'Study Design', 'Areas of Programme', 'Impact Statement']

export const palette = {
    'ciffPink':'#e90051',
    'ciffBlue':'#189cac',
    'ciffGold':'#ffbd00',
    'ciffPurple':'#7646ad',
    'warmPink':'#e9546e',
    'dustyPink':'#ffe6ea',
    'lightPink':'#ffb3bb',
    'offBlack':'#2b2b2b',
    'darkGray':'#8d8d8d',
    'coolGrey':'#cfcccc',
    'warmGray':'#e8e5e3',
    'lightGray':'#f0f0f0'
};

export const inactiveStyle = {
    weight: 0,
    color: '#fff',
    fillOpacity: 0,
    fillColor: palette['darkGray'],
    zIndex: 200,
    active: 'false'
}

export const activeStyle = {
    weight: 1,
    color: palette['ciffPink'],
    opacity: 1,
    fillOpacity: 0.5,
    fillColor: palette['ciffPink'],
    zIndex: 300,
    active: 'yes'
}

export const regionStyle = {
    weight: 1,
    color: palette['ciffPink'],
    opacity: 1,
    fillOpacity: 0.5,
    fillColor: palette['ciffGold'],
    zIndex: 800,
}

export const pointStyle = {
    radius: 3,
    weight: 1,
    color: palette['offBlack'],
    opacity: 1,
    fillOpacity: 1,
    fillColor: palette['offBlack'],
}