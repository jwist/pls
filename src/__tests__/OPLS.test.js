import { Matrix } from 'ml-matrix';

import { OPLS } from '../OPLS.js';
import { oplsNIPALS } from '../oplsNIPALS.js';
import { plsNIPALS } from '../plsNIPALS.js';
import { nipals } from '../nipals.js';
import { sampleAClass, summaryMetadata, tss } from '../utils.js';

describe('OPLS preparation', () => {
  let rawData = require('../../data/irisDataset.json');
  rawData = rawData.map((d) => d.slice(0, 4));
  let x = new Matrix(150, 4);
  rawData.forEach((el, i) => x.setRow(i, rawData[i]));
  it('test that iris X scaling is similar to scaling in R', () => {
    x = x.center('column').scale('column');
    expect(x.get(0, 0)).toBeCloseTo(-0.8976739, 6);
  });
  it('test that iris Y scaling is similar to scaling in R', () => {
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    let y = summaryMetadata(metadata).classMatrix;
    y = y.center('column').scale('column');
    console.log(JSON.stringify(y.to1DArray()));
    expect(y.get(0, 0)).toBeCloseTo(-1.220656, 6);
  });
  it('create cvFolds', () => {
    let cvSet = require('../../data/cvSets.json');
    cvSet[0] = cvSet[0].map((x) => x.map((y) => y - 1));
    let cvFold = [];
    for (let cv of cvSet[0]) {
      let testCv = [];
      for (let j = 0; j < 150; j++) {
        if (!cv.includes(j)) {
          testCv.push(j);
        }
      }
      cvFold.push({ testIndex: testCv, trainIndex: cv });
    }
    // console.log(JSON.stringify(cvFold));
    expect(cvFold).toHaveLength(7);
  });
});


describe('OPLS', () => {
  it('test first opls loop nComp = 1 and fold = 1', () => {
    let rawData = require('../../data/irisDataset.json');
    let cvSet = require('../../data/cvSets.json');
    let testRawData = rawData.filter((el, idx) => !cvSet[0][0].includes(idx));
    rawData = rawData.filter((el, idx) => cvSet[0][0].includes(idx));
    let metadata = rawData.map((d) => d[4]);
    let y = summaryMetadata(metadata).classMatrix;
    y = y.center('column').scale('column');
    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(127, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));
    let center = x.mean('column');
    let sd = x.standardDeviation('column');
    x.center('column').scale('column');

    expect(y.get(0, 0)).toBeCloseTo(-1.22030407, 6);
    expect(y.get(126, 0)).toBeCloseTo(1.25935380, 6);
    expect(x.get(0, 0)).toBeCloseTo(-0.86171924, 6);
    let opls = oplsNIPALS(x, y);

    expect(opls.filteredX.get(0, 0)).toBeCloseTo(-1.055718013, 8);
    expect(opls.filteredX.get(3, 3)).toBeCloseTo(-1.316108827, 8);
    expect(opls.filteredX.get(126, 2)).toBeCloseTo(0.949878685, 8);

    expect(opls.scoresXpred.get(0, 0)).toBeCloseTo(-2.258296156, 8);
    expect(opls.scoresXpred.get(126, 0)).toBeCloseTo(1.003592216, 8);
    expect(opls.scoresXpred.sum()).toBeCloseTo(-3.468059e-14, 8);

    expect(opls.loadingsXpred.get(0, 0)).toBeCloseTo(0.525843, 6);
    expect(opls.loadingsXpred.get(0, 1)).toBeCloseTo(-0.2431478, 6);
    expect(opls.loadingsXpred.get(0, 3)).toBeCloseTo(0.5698576, 6);

    expect(opls.weightsPred.get(0, 0)).toBeCloseTo(0.4852953, 6);
    expect(opls.weightsPred.get(1, 0)).toBeCloseTo(-0.2406125, 6);

    expect(opls.weightsXOrtho.get(0, 0)).toBeCloseTo(0.8165095, 6);
    expect(opls.weightsXOrtho.get(0, 2)).toBeCloseTo(-0.1230943, 6);

    expect(opls.loadingsY.get(0, 0)).toBeCloseTo(0.5561059, 6);
    expect(opls.scoresXOrtho.get(0, 0)).toBeCloseTo(0.144701329, 8);
    expect(opls.loadingsXOrtho.get(0, 0)).toBeCloseTo(1.340684);

    let xResidual = opls.filteredX;
    let plsComp = nipals(xResidual, { Y: y });

    expect(plsComp.xResidual.get(0, 0)).toBeCloseTo(0.0746564622, 2);
    expect(plsComp.xResidual.get(3, 3)).toBeCloseTo(0.1006373429, 2);
    expect(plsComp.xResidual.get(126, 2)).toBeCloseTo(0.1542974407, 2);

    expect(plsComp.yResidual.get(0, 0)).toBeCloseTo(0.148422167, 8);
    expect(plsComp.yResidual.get(3, 0)).toBeCloseTo(0.166480767, 8);
    expect(plsComp.yResidual.get(126, 0)).toBeCloseTo(0.477856213, 8);

    expect(plsComp.t.get(0, 0)).toBeCloseTo(-2.36832783, 8);
    expect(plsComp.t.get(4, 0)).toBeCloseTo(-2.21912839, 8);
    expect(plsComp.t.get(125, 0)).toBeCloseTo(1.90700548, 8);

    expect(plsComp.p.get(0, 0)).toBeCloseTo(0.477288, 3);
    expect(plsComp.p.get(0, 3)).toBeCloseTo(0.5904155, 2);
    expect(plsComp.w.get(0, 0)).toBeCloseTo(0.4852953, 6);
    expect(plsComp.w.get(0, 2)).toBeCloseTo(0.5910032, 6);
    expect(plsComp.betas.get(0, 0)).toBeCloseTo(0.5779294, 3);

    // scaling of the test dataset with respect to the train
    testRawData = testRawData.map((d) => d.slice(0, 4));
    let testx = new Matrix(23, 4);
    testRawData.forEach((el, i) => testx.setRow(i, testRawData[i]));
    testx.center('column', { center: center });
    testx.scale('column', { scale: sd });

    expect(testx.get(0, 0)).toBeCloseTo(-1.10145274, 6);
    expect(testx.get(3, 3)).toBeCloseTo(-1.1829865, 6);

    let Eh = testx;
    // removing the orthogonal components from PLS
    let scores = Eh.mmul(opls.weightsXOrtho.transpose());
    Eh = Eh.clone().sub(scores.clone().mmul(opls.loadingsXOrtho));

    expect(scores.get(0, 0)).toBeCloseTo(0.009042318, 6);
    expect(scores.get(4, 0)).toBeCloseTo(-0.103439622, 6);
    expect(Eh.get(0, 0)).toBeCloseTo(-1.11357563, 6);
    expect(Eh.get(22, 1)).toBeCloseTo(-1.22642102, 6);

    let tPred = Eh.clone().mmul(plsComp.w.transpose());
    expect(tPred.get(0, 0)).toBeCloseTo(-2.0983292, 6);
    expect(tPred.get(7, 0)).toBeCloseTo(-2.4324436, 6);
    // let R = plsComp.betas.clone().mmul(tPred).mul(plsComp.qPC);
    let Yhat = tPred.clone().mmul(plsComp.betas);
    expect(Yhat.get(0, 0)).toBeCloseTo(-1.21268611, 6);
    expect(Yhat.get(7, 0)).toBeCloseTo(-1.40578061, 6);
  });
  it('test first opls loop nComp = 1 with all folds', () => {
    let cvSet = require('../../data/cvSets.json');
    let cvPreds = new Matrix(150, 1);
    let cvScoresO = new Matrix(150, 1);
    let cvScoresP = new Matrix(150, 1);
    for (let cv of cvSet[0]) {
      let rawData = require('../../data/irisDataset.json');
      let testRawData = rawData.filter((el, idx) => !cv.includes(idx));

      rawData = rawData.filter((el, idx) => cv.includes(idx));

      let metadata = rawData.map((d) => d[4]);
      let y = summaryMetadata(metadata).classMatrix;
      y = y.center('column').scale('column');
      rawData = rawData.map((d) => d.slice(0, 4));
      let x = new Matrix(rawData.length, 4);
      rawData.forEach((el, i) => x.setRow(i, rawData[i]));
      let center = x.mean('column');
      let sd = x.standardDeviation('column');
      x.center('column').scale('column');

      let opls = oplsNIPALS(x, y);

      let xResidual = opls.filteredX;
      let plsComp = nipals(xResidual, { Y: y });

      testRawData = testRawData.map((d) => d.slice(0, 4));
      let testx = new Matrix(testRawData.length, 4);
      testRawData.forEach((el, i) => testx.setRow(i, testRawData[i]));
      testx.center('column', { center: center });
      testx.scale('column', { scale: sd });

      let Eh = testx;
      // removing the orthogonal components from PLS
      let scores = Eh.clone().mmul(opls.weightsXOrtho.transpose());
      Eh.sub(scores.clone().mmul(opls.loadingsXOrtho));

      let tPred = Eh.clone().mmul(plsComp.w.transpose());
      let Yhat = tPred.clone().mmul(plsComp.betas);

      let testCv = [];
      for (let j = 0; j < 150; j++) {
        if (!cv.includes(j)) {
          testCv.push(j);
        }
      }

      testCv.forEach((el, idx) => cvPreds.setRow(el, [Yhat.get(idx, 0)]));
      testCv.forEach((el, idx) => cvScoresO.setRow(el, [scores.get(idx, 0)]));
      testCv.forEach((el, idx) => cvScoresP.setRow(el, [tPred.get(idx, 0)]));
    }
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    let y = summaryMetadata(metadata).classMatrix;
    y.center('column').scale('column');
    let tssy = tss(y);
    let press = tss(y.clone().sub(cvPreds));

    expect(cvPreds.get(0, 0)).toBeCloseTo(-1.42935863, 6);
    expect(cvPreds.get(3, 0)).toBeCloseTo(-1.16151882, 6);
    expect(press).toBeCloseTo(11.78251, 5);
    expect(tssy).toBeCloseTo(149, 10);
    expect(1 - (press / tssy)).toBeCloseTo(0.9209228, 6);

    // expect(tss(1 - (y.sub(cvPreds)) / tss(y))).toBeCloseTo(11.78251, 5);
  });
  it('test first OPLS loop nComp = 1 with all folds', () => {
    let cvFolds = require('../../data/cvFolds.json');

    let rawData = require('../../data/irisDataset.json');

    // prep Y (labels)
    let metadata = rawData.map((d) => d[4]);
    // let y = summaryMetadata(metadata).classMatrix;
    // y.center('column').scale('column');

    // prep x (features)
    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(rawData.length, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));
    // get center and scale for later
    // let center = x.mean('column');
    // let sd = x.standardDeviation('column');
    // center and scale x
    // x.center('column').scale('column');
    let oplsOptions = { cvFolds,
      trainFraction: 0,
      nComp: 1 };
    let opls = new OPLS(x, metadata, oplsOptions);
    expect(opls.summary()[0].Q2y[0]).toBeCloseTo(0.9209228, 6);
    expect(opls.summary()[0].R2y).toBeCloseTo(0.9284787, 6);
    expect(opls.summary()[0].tPred[0]).toBeCloseTo(-2.32295367, 6);
    expect(opls.summary()[0].tOrth[0]).toBeCloseTo(0.074537852, 6);
    expect(opls.summary()[0].tOrth[149]).toBeCloseTo(-0.486465664, 6);
    expect(opls.summary()[0].totalPred[0]).toBeCloseTo(-1.33501112, 6);
    expect(opls.summary()[0].oplsC.filteredX.get(0, 0)).toBeCloseTo(-0.99598366, 6);
    expect(opls.summary()[0].oplsC.scoresXOrtho.get(0, 0)).toBeCloseTo(0.074537852, 6);
  });
});

describe('OPLS utility functions', () => {
  it('test tss', () => {
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    let y = summaryMetadata(metadata).classMatrix;
    y = y.center('column').scale('column');
    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(150, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));
    x = x.center('column').scale('column');
    expect(y.get(0, 0)).toBeCloseTo(-1.220656, 6);
    expect(tss(x)).toBeCloseTo(596, 6);
    expect(tss(y)).toStrictEqual(149);
  });
  it('test total prediction', () => {
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    let y = summaryMetadata(metadata).classMatrix;
    y = y.center('column').scale('column');

    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(150, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));
    x = x.center('column').scale('column');

    let res = oplsNIPALS(x, y);
    let xRes = res.filteredX;
    expect(xRes.get(0, 0)).toBeCloseTo(-0.99598366, 6);
    expect(res.scoresXOrtho.get(0, 0)).toBeCloseTo(0.074537852, 6);

    let plsComp = nipals(xRes, { Y: y });
    expect(plsComp.t.get(0, 0)).toBeCloseTo(-2.32295367, 6);
    expect(plsComp.xResidual.get(0, 1)).toBeCloseTo(0.340980373, 3);
    expect(plsComp.yResidual.get(0, 0)).toBeCloseTo(0.1143555571, 6);
    expect(plsComp.p.get(0, 1)).toBeCloseTo(-0.2864595, 3);
    expect(plsComp.w.get(0, 0)).toBeCloseTo(0.484385, 6);

    let tPred = xRes.clone().mmul(plsComp.w.transpose());
    expect(tPred.get(0, 0)).toBeCloseTo(-2.32295367, 6);
    let Yhat = tPred.clone().mmul(plsComp.betas);
    expect(Yhat.get(0, 0)).toBeCloseTo(-1.33501112, 6);

    let tssy = tss(y);
    expect(tssy).toBeCloseTo(149, 6);
    let rss = y.clone().sub(Yhat);
    rss = rss.clone().mul(rss).sum();
    expect(rss).toBeCloseTo(10.65667, 5);
    let R2y = 1 - (rss / tssy);
    expect(R2y).toBeCloseTo(0.9284787, 6);

    let xEx = plsComp.t.clone().mmul(plsComp.p.clone());
    let rssx = tss(xEx);
    expect(rssx).toBeCloseTo(419.0932, 0);
    let tssx = tss(x);
    expect(tssx).toBeCloseTo(596, 6);
    let R2x = (rssx / tssx);
    expect(R2x).toBeCloseTo(0.7031765, 2);
  });
  it('test OPLS sampleAClass', () => {
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    let c = sampleAClass(metadata, 0.1).trainIndex;
    let d = [];
    c.forEach((el) => d.push(metadata[el]));
    let counts = {};
    d.forEach((x) => {
      counts[x] = (counts[x] || 0) + 1;
    });
    expect(sampleAClass(metadata, 0.1).trainIndex).toHaveLength(15);
    expect(sampleAClass(metadata, 0.1).testIndex).toHaveLength(135);
    expect(sampleAClass(metadata, 0.1).mask).toHaveLength(150);
    expect(JSON.stringify(counts)).toBe(JSON.stringify({ setosa: 5, versicolor: 5, virginica: 5 }));
  });
  it('test OPLS sampleAClass 2', () => {
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    let c = sampleAClass(metadata, 0.1).mask;

    let train = metadata.filter((f, idx) => c[idx]);
    let test = metadata.filter((f, idx) => !c[idx]);
    expect(train).toHaveLength(15);
    expect(test).toHaveLength(135);
    expect(sampleAClass(metadata, 0.1).mask).toHaveLength(150);
  });
  it('test OPLS dataArray', () => {
    let rawData = require('../../data/irisDataset.json');
    let metadata = rawData.map((d) => d[4]);
    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(150, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));

    let trainTestLabels = require('../../data/trainTestLabels.json');
    let options = { trainTestLabels, nComp: 3 };
    let model = new OPLS(x, metadata, options);
    expect(model.summary()).toHaveLength(3);
  });
});

describe('OPLS plot functions', () => {
  it('test nComp = 1', () => {
    let rawData = require('../../data/irisDataset.json');

    let cvFolds = require('../../data/cvFolds.json');

    let metadata = rawData.map((d) => d[4]);
    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(150, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));

    let trainTestLabels = require('../../data/trainTestLabels.json');
    let options = { trainTestLabels, nComp: 1, cvFolds };
    let model = new OPLS(x, metadata, options);
    console.log(model.getResults());
    expect(model.summary()).toHaveLength(1);
    expect(model.getResults().tPred[0]).toBeCloseTo(-2.32295367, 6);
    expect(model.getResults().pPred[0]).toBeCloseTo(0.4777117, 3);
    expect(model.getResults().wPred[0]).toBeCloseTo(0.484385, 6);
    expect(model.getResults().tOrth[0]).toBeCloseTo(0.074537852, 6);
    expect(model.getResults().pOrth[0]).toBeCloseTo(1.318924, 3);
    expect(model.getResults().wOrth[0]).toBeCloseTo(0.7888785, 6);
    expect(model.getResults().betasPred.get(0, 0)).toBeCloseTo(0.5747042, 6);
    expect(model.getResults().Qpc.get(0, 0)).toBeCloseTo(1, 6);
    expect(model.getResults().Q2y[0]).toBeCloseTo(0.9209228, 6);
    expect(model.getResults().R2x[0]).toBeCloseTo(0.7031765, 2);
    expect(model.getResults().R2y[0]).toBeCloseTo(0.9284787, 6);
    expect(model.getResults().Yres[0]).toBeCloseTo(0.1143555571, 6);
    expect(model.getResults().E.get(0, 0)).toBeCloseTo(0.113718555, 3);
    expect(model.getResults().tCV[0][0]).toBeCloseTo(-2.32142563, 6);
    expect(model.getResults().tOrthCV[0][0]).toBeCloseTo(0.15252633, 6);
  });
  it('test nComp = 2', () => {
    let rawData = require('../../data/irisDataset.json');

    let cvFolds = require('../../data/cvFolds.json');

    let metadata = rawData.map((d) => d[4]);
    rawData = rawData.map((d) => d.slice(0, 4));
    let x = new Matrix(150, 4);
    rawData.forEach((el, i) => x.setRow(i, rawData[i]));

    let trainTestLabels = require('../../data/trainTestLabels.json');
    let options = { trainTestLabels, nComp: 2, cvFolds };
    let model = new OPLS(x, metadata, options);
    console.log(model.getResults());
    expect(model.summary()).toHaveLength(2);
    expect(model.getResults().tPred[0]).toBeCloseTo(-2.32295367, 6);
    expect(model.getResults().pPred[0]).toBeCloseTo(0.4777117, 3);
    expect(model.getResults().wPred[0]).toBeCloseTo(0.484385, 6);
    expect(model.getResults().tOrth[0]).toBeCloseTo(0.074537852, 6);
    expect(model.getResults().pOrth[0]).toBeCloseTo(1.318924, 3);
    expect(model.getResults().wOrth[0]).toBeCloseTo(0.7888785, 6);
    expect(model.getResults().betasPred.get(0, 0)).toBeCloseTo(0.5747042, 6);
    expect(model.getResults().Qpc.get(0, 0)).toBeCloseTo(1, 6);
    expect(model.getResults().Q2y[0]).toBeCloseTo(0.9209228, 6);
    expect(model.getResults().R2x[0]).toBeCloseTo(0.7031765, 2);
    expect(model.getResults().R2y[0]).toBeCloseTo(0.9284787, 6);
    expect(model.getResults().Yres[0]).toBeCloseTo(0.1143555571, 6);
    expect(model.getResults().E.get(0, 0)).toBeCloseTo(0.113718555, 3);
    expect(model.getResults().tCV[0][0]).toBeCloseTo(-2.32142563, 6);
    expect(model.getResults().tOrthCV[0][0]).toBeCloseTo(0.15252633, 6);
  });
});
