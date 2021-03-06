//シンプルなテキスト
exports.textMessage = function(text) {
    return {
      "type": "text",
      "text": text
    }
}
//複数イメージ
exports.imagemapMessage = function(messages, url) {
    return {
        "type": "imagemap",
        "baseUrl": url, // input your image path
        "altText": "This is an imagemap",
        "baseSize": {　"height": 1040,"width": 1040},
        "actions": [
            {
                "type": "message",
                "text": messages[0],
                "area": {
                "x": 0,
                "y": 360,
                "width": 520,
                "height": 340
                }
            },
            {
                "type": "message",
                "text": messages[1],
                "area": {
                "x": 520,
                "y": 360,
                "width": 520,
                "height": 340
                }
            },
            {
                "type": "message",
                "text": messages[2],
                "area": {
                "x": 0,
                "y": 700,
                "width": 520,
                "height": 340
                }
            },
            {
                "type": "message",
                "text": messages[3],
                "area": {
                "x": 520,
                "y": 700,
                "width": 520,
                "height": 340
                }
            }
        ]
    }
}
//イメージ一個+メッセージ
exports.singleImagemapMessage = function(typeName) {
    if (typeName == "0") {
        return {
            "type": "imagemap",
            "baseUrl": "https://chart.apis.google.com/chart?cht=tx&chl=a-b", // input your image path
            "altText": "text1",
            "baseSize": {
                "width": 1040,
                "height": 1040
            },
            "actions": [{
                "type": "message",
                "text": "text2",
                "area": {
                "x": 0,
                "y": 0,
                "width": 1040,
                "height": 1040
                }
            }]
        }
    }
}
  /**
   * Componse parameter for Image Message with given arguments
   * @param {string} url image url with ssl protocol
   * @param {string} previewUrl image url with ssl protocol for preview, optional
   * @return {object} object with schema defined as Image Message API parameter
   */
//イメージ一個
exports.imageMessage = function(url, previewUrl) {
    return {
        "type": "image",
        "originalContentUrl": url,
        "previewImageUrl": previewUrl || url
    }
}

exports.quickMessage = function(questionText,item) {
  switch(item.length){
    case 2:
      return {
          "type": "text",
          "text": questionText,
          "quickReply": {
          "items": [{
                  "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[0],
                      "text": item[0]
                  }
              },
              {
                  "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[1],
                      "text": item[1]
                  }
              }]
          }
      }
      break;
    case 3:
      return {
          "type": "text",
          "text": questionText,
          "quickReply": {
          "items": [{
                  "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[0],
                      "text": item[0]
                  }
              },
              {
                  "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[1],
                      "text": item[1]
                  }
              },
              {
                "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[2],
                      "text": item[2]
                  }
              }]
          }
      }
      break;
    case 4:
      return {
          "type": "text",
          "text": questionText,
          "quickReply": {
          "items": [{
                  "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[0],
                      "text": item[0]
                  }
              },
              {
                  "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[1],
                      "text": item[1]
                  }
              },
              {
                "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[2],
                      "text": item[2]
                  }
              },{
                "type": "action",
                  "action": {
                      "type": "message",
                      "label": item[3],
                      "text": item[3]
                  }
              }]
          }
      }
      break;
  }
    
}

//カスタムクエッション（flexMessage)
exports.customQuestionMessage = function(title, imageUrl, qustions, answers) {
  console.log("customQuestionMessage qustions "+ qustions);
  return new Promise(resolve=>{
    resolve({
                "type": "flex",
                "altText": "this is a flex message",
                "contents": customFunc(title, imageUrl, qustions, answers)
            });
    });
}

  function customFunc(title, imageUrl, qustions, answers) {
    if(imageUrl.match(/^https:/)){
      switch(qustions.length){
      case 2:
        //console.log("customFunc in 2");
        return {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": imageUrl,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "fit"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
              "type": "uri",
              "uri": "https://linecorp.com"
            },
            "contents": [{
                "type": "text",
                "wrap": true,
                "text": title,
                "size": "md"
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "1",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[0],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "2",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[1],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "horizontal",
            "contents": [{
                "type": "button",
                "style": "primary",
                "color": "#30A9DE",
                "action": {
                  "type": "message",
                  "label": "1",
                  "text": answers[0]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#EFDC05",
                "action": {
                  "type": "message",
                  "label": "2",
                  "text": answers[1]
                }
              }
            ]
          }
        }
        break;
      case 3:
        //console.log("customFunc in 3");
        return {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": imageUrl,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "fit"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
              "type": "uri",
              "uri": "https://linecorp.com"
            },
            "contents": [{
                "type": "text",
                "wrap": true,
                "text": title,
                "size": "md"
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "1",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[0],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "2",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[1],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "3",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[2],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "horizontal",
            "contents": [{
                "type": "button",
                "style": "primary",
                "color": "#30A9DE",
                "action": {
                  "type": "message",
                  "label": "1",
                  "text": answers[0]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#EFDC05",
                "action": {
                  "type": "message",
                  "label": "2",
                  "text": answers[1]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#E53A40",
                "action": {
                  "type": "message",
                  "label": "3",
                  "text": answers[2]
                }
              }
            ]
          }
        }
        break;
      case 4:
        //console.log("customFunc in 4");
        return {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": imageUrl,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "fit"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
              "type": "uri",
              "uri": "https://linecorp.com"
            },
            "contents": [{
                "type": "text",
                "wrap": true,
                "text": title,
                "size": "md"
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "1",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[0],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "2",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[1],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "3",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[2],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "4",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[3],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "horizontal",
            "contents": [{
                "type": "button",
                "style": "primary",
                "color": "#30A9DE",
                "action": {
                  "type": "message",
                  "label": "1",
                  "text": answers[0]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#EFDC05",
                "action": {
                  "type": "message",
                  "label": "2",
                  "text": answers[1]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#E53A40",
                "action": {
                  "type": "message",
                  "label": "3",
                  "text": answers[2]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#5CAB7D",
                "action": {
                  "type": "message",
                  "label": "4",
                  "text": answers[3]
                }
              }
            ]
          }
        }
        break;
    }
    }else{
      switch(qustions.length){
      case 2:
        //console.log("customFunc in 2");
        return {
          "type": "bubble",
          "hero": {
            "type": "text",
            "text": imageUrl,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
              "type": "uri",
              "uri": "https://linecorp.com"
            },
            "contents": [{
                "type": "text",
                "wrap": true,
                "text": title,
                "size": "md"
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "1",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[0],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "2",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[1],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "horizontal",
            "contents": [{
                "type": "button",
                "style": "primary",
                "color": "#30A9DE",
                "action": {
                  "type": "message",
                  "label": "1",
                  "text": answers[0]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#EFDC05",
                "action": {
                  "type": "message",
                  "label": "2",
                  "text": answers[1]
                }
              }
            ]
          }
        }
        break;
      case 3:
        //console.log("customFunc in 3");
        return {
          "type": "bubble",
          "hero": {
            "type": "text",
            "text": imageUrl,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
              "type": "uri",
              "uri": "https://linecorp.com"
            },
            "contents": [{
                "type": "text",
                "wrap": true,
                "text": title,
                "size": "md"
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "1",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[0],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "2",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[1],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "3",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[2],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "horizontal",
            "contents": [{
                "type": "button",
                "style": "primary",
                "color": "#30A9DE",
                "action": {
                  "type": "message",
                  "label": "1",
                  "text": answers[0]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#EFDC05",
                "action": {
                  "type": "message",
                  "label": "2",
                  "text": answers[1]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#E53A40",
                "action": {
                  "type": "message",
                  "label": "3",
                  "text": answers[2]
                }
              }
            ]
          }
        }
        break;
      case 4:
        //console.log("customFunc in 4");
        return {
          "type": "bubble",
          "hero": {
            "type": "text",
            "text": imageUrl,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
              "type": "uri",
              "uri": "https://linecorp.com"
            },
            "contents": [{
                "type": "text",
                "wrap": true,
                "text": title,
                "size": "md"
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "1",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[0],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "2",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[1],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "3",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[2],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "contents": [{
                    "type": "text",
                    "text": "4",
                    "flex": 1
                  },
                  {
                    "type": "text",
                    "text": qustions[3],
                    "weight": "bold",
                    "flex": 6
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "horizontal",
            "contents": [{
                "type": "button",
                "style": "primary",
                "color": "#30A9DE",
                "action": {
                  "type": "message",
                  "label": "1",
                  "text": answers[0]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#EFDC05",
                "action": {
                  "type": "message",
                  "label": "2",
                  "text": answers[1]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#E53A40",
                "action": {
                  "type": "message",
                  "label": "3",
                  "text": answers[2]
                }
              },
              {
                "type": "button",
                "style": "primary",
                "color": "#5CAB7D",
                "action": {
                  "type": "message",
                  "label": "4",
                  "text": answers[3]
                }
              }
            ]
          }
        }
        break;
    }
    }
    
  }