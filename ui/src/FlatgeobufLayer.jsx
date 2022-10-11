import { useEffect, useState, useMemo } from "react";
const baseApi = import.meta.env.VITE_API_BASE;

/**
 * Generates a source and layer for a flatgeobuf dile
 */
function FlatgeobufLayer(props) {
  const { name, type, enabled } = props;
  if (["point", "polygon", "line"].indexOf(type) === -1)
    throw new Error(`Unknown type "${type}" in layer ${name}`);

  const apiEndpoint = useMemo(() => `${baseApi}/${name}/fgb`, [name, baseApi]);

  return <div>FlatgeobufLayer {name}</div>;
}

export default FlatgeobufLayer;
