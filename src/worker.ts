import TSNE from "tsne-js";

addEventListener("message", function (e) {
  let data = e.data;
  let processedData = reduceDimensionality(data);
  self.postMessage(processedData);
});

function reduceDimensionality(data: number[][]) {
  //Image processing
  let model = new TSNE({
    dim: 2,
    perplexity: 30.0,
    earlyExaggeration: 4.0,
    learningRate: 100.0,
    nIter: 1000,
    metric: "euclidean",
  });

  model.init({
    data: data,
    type: "dense",
  });

  let [error, iter] = model.run();

  // outputScaled is output scaled to a range of [-1, 1]
  let outputScaled = model.getOutputScaled();

  return outputScaled;
}
