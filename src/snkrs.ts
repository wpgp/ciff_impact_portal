interface Sneaker {
    id: string;
    colorway: string;
    imageUrl: string;
    model: string;
    brand: string;
  }
  
let SNEAKERS: Sneaker[] = [
    {
      id: "1",
      colorway: "Green",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/bkkj0lqzlwlwdwtofqxs",
      model: "Vintage",
      brand: "Nike",
    },
    {
      id: "2",
      colorway: "Red",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/RPlzC_CBHjiMM4dr90gdU",
      model: "AirMax",
      brand: "Nike",
    },
    {
      id: "3",
      colorway: "Green",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/0bf9336b-03c9-4cbd-b482-f4e80b770582",
      model: "AirMax",
      brand: "Nike",
    },
    {
      id: "5",
      colorway: "Beluga",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/irxakb1ij0uzmcvn9szo",
      model: "Yeezy",
      brand: "Adidas",
    },
    {
      id: "6",
      colorway: "Red",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/g9tjjjdn476nhou1c1dj",
      model: "Grid SD",
      brand: "Saucony",
    },
    {
      id: "7",
      colorway: "Red",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/erg1lxa8x29h1wtbog9a",
      model: "AirMax",
      brand: "Vans",
    },
    {
      id: "8",
      colorway: "Beluga",
      imageUrl:
        "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/u4z27k4wyzr7bxatlfgj",
      model: "AirMax",
      brand: "Nike",
    },
  ];
  
function filterByBrand(brand, color) {
    let selected = SNEAKERS;
    if (brand !== null) {
        selected = SNEAKERS.filter((sneaker) => sneaker.brand.toLowerCase() === brand.toLowerCase())
    }
    if (color !== null) {
        selected = SNEAKERS.filter((sneaker) => sneaker.colorway.toLowerCase() === color.toLowerCase())
    }
    return selected;
  }
  
  function getSneakerById(id: string) {
    return SNEAKERS.find((sneaker) => sneaker.id === id);
  }
  
  let brands = [...new Set(SNEAKERS.map((sneaker) => sneaker.brand))];
  
  let colors = [...new Set(SNEAKERS.map((sneaker) => sneaker.colorway))];

  export { brands, colors, SNEAKERS, filterByBrand, getSneakerById };