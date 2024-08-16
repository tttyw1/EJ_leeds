require([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/widgets/Legend",
        "esri/widgets/Expand",
        "esri/smartMapping/statistics/classBreaks",
        "esri/renderers/ClassBreaksRenderer",  
        "esri/smartMapping/symbology/relationship",
        "esri/smartMapping/renderers/relationship",
        "esri/smartMapping/statistics/summaryStatistics",
        "esri/widgets/Search"
    ], function(esriConfig, Map, MapView, FeatureLayer, Legend, Expand,classBreaks,ClassBreaksRenderer,relationshipSchemes, relationshipRendererCreator, summaryStatistics, Search) {

        // 定义函数
        const retrieveAverage = function(variableName) {
            return summaryStatistics({
                layer: customLayer,
                field: variableName
            }).then(function(statistics) {
                return statistics.avg;
            });
        };
        // 创建地图
        const map = new Map({
            basemap: "gray-vector"
        });

        // 创建视图
        const view = new MapView({
            container: "viewDiv",
            map: map,
            center: [-1.5,53.83], // 中心经纬度
            zoom: 10
        });

        // 创建要素图层
        const customLayer = new FeatureLayer({
            url: "https://services3.arcgis.com/zqHx3dnSyFS5bMVS/arcgis/rest/services/data1/FeatureServer/0"
        });

        // 添加图层到地图
        map.add(customLayer);

        async function updateRenderer(field) {
            const breaks = await classBreaks({
                layer: customLayer,
                field: field,
                classificationMethod: "quantile",
                numClasses: 5
            });
            
            const classBreakInfos = breaks.classBreakInfos.map((info, index) => ({
                minValue: info.minValue,
                maxValue: info.maxValue,
                symbol: {
                    type: "simple-fill",
                    color: ["#fef0d9ff", "#fdcc8aff", "#fc8d59ff", "#e34a33ff", "#b30000ff"][index],
                    outline: {
                        color: "#999999", // Border color (black)
                        width: 0.5           // Border width (1px)
                    }
                }
            }));

            const renderer = new ClassBreaksRenderer({
                field: field,
                classBreakInfos: classBreakInfos
            });

            customLayer.renderer = renderer;
        }
        document.querySelectorAll('input[name="variable"]').forEach(input => {
            input.addEventListener('change', event => {
                const selectedVariable = event.target.value;
                updateRenderer(selectedVariable);
            });
        });
        /* 监听按钮点击事件
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const selectedRadio = document.querySelector(`#${category}-attributes input[name="variable"]:checked`);
                const attribute = selectedRadio ? selectedRadio.value : null;

                if (attribute) {
                    updateRenderer(attribute);
                }
            });
        });*/

        // 双变量渲染函数
        const renderBivariateLayer = function(field1, field2) {
            const schemes = relationshipSchemes.getSchemes({
                basemap: map.basemap,
                geometryType: customLayer.geometryType
            });

            const params = {
                layer: customLayer,
                view: view,
                relationshipScheme: schemes.secondarySchemes[1],
                field1: {
                    field: field1
                },
                field2: {
                    field: field2
                },
                numClasses: 3,
                scheme: "secondary2",
                focus: null,
                edgesType: "solid"
            };

            relationshipRendererCreator.createRenderer(params)
            .then(function(response) {
                customLayer.renderer = response.renderer;
            });
        };

        // 初始渲染

       // const executeRender = function(endOutput) {
       //     const render = endOutput.renderer;
        //    customLayer.renderer = render;
       // };

        

        // 图例控件
        const legend = new Legend({
            view: view,
            layerInfos: [{ layer: customLayer, title: "Leeds Distribution Map" }]
        });

        const legendExpand = new Expand({
            expandIconClass: "esri-icon-key",
            expanded: true,
            view: view,
            group: "bottom-right",
            content: legend
        });
        view.ui.add(legendExpand, {
            position: "bottom-right"
        });

        // 自定义控件
        const selectionMenu = document.getElementById("variable-selector");
        const contentInsidePopup = new Expand({
            expandIcon: "sliders-horizontal",
            expanded: true,
            view: view,
            group: "top-left",
            content: selectionMenu
        });
        view.ui.add(contentInsidePopup, {
            position: "top-left",
            index: 1
        });
        const infoMenu = document.getElementById("information");
        const infoContent = new Expand({
            expandIcon: "information",
            expanded: false,
            view: view,
            group: "top-left",
            content: infoMenu
        });
        view.ui.add(infoContent, {
            position: "top-left",
            index: 3
        });


        // 事件监听器：展开和折叠菜单项
        document.querySelectorAll('.toggle-btn').forEach(function(button) {
            button.addEventListener('click', function() {
                // 取得当前按钮对应的菜单项
                const category = button.dataset.category;
                const attributes = document.getElementById(category + '-attributes');
                
                // 关闭所有菜单项
                document.querySelectorAll('.attributes').forEach(function(attr) {
                    if (attr.id !== category + '-attributes') {
                        attr.style.display = 'none';
                    }
                });

                // 切换当前按钮的菜单项显示状态
                if (attributes.style.display === 'none' || attributes.style.display === '') {
                    attributes.style.display = 'block';
                } else {
                    attributes.style.display = 'none';
                }
            });
        });

        /* 事件监听器：展开和折叠菜单项
        document.querySelectorAll('.toggle-btn').forEach(function(button) {
            button.addEventListener('click', function() {
                const attributes = document.getElementById(button.dataset.category + '-attributes');
                if (attributes.style.display === 'none' || attributes.style.display === '') {
                    attributes.style.display = 'block';
                } else {
                    attributes.style.display = 'none';
                }
            });
        });
        // 监听双变量选择
        const bivariateAttributes = document.querySelectorAll('#bivariate-map-attributes input[type="radio"]');
        bivariateAttributes.forEach(attr => {
            attr.addEventListener('change', () => {
                currentCategory = 'bivariate-map';
                const selectedVariable1 = document.querySelector('input[name="variable1"]:checked')?.value;
                const selectedVariable2 = document.querySelector('input[name="variable2"]:checked')?.value;

                if (selectedVariable1 && selectedVariable2) {
                    renderBivariateLayer(selectedVariable1, selectedVariable2);
                }
            });
        });

        // 监听其他类别选择
        const otherCategories = document.querySelectorAll('.toggle-btn');
        otherCategories.forEach(btn => {
            btn.addEventListener('click', () => {
                const currentCategory = btn.dataset.category;
                const selectedRadio = document.querySelector(`#${currentCategory}-attributes input[name="variable"]:checked`);
                const attribute = selectedRadio ? selectedRadio.value : null;

                if (attribute) {
                    updateRenderer(attribute);
                }
            });
        });*/
        // 全局状态变量
        let currentCategory = "";

        // 为类别按钮添加点击事件，设置当前类别
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有按钮的 active 类
                toggleButtons.forEach(btn => btn.classList.remove('active'));

                // 为当前点击的按钮添加 active 类
                button.classList.add('active');

                // 更新全局状态
                currentCategory = button.dataset.category;
            });
        });
        function generateBivariatePopupContent(attributes, variable1, variable2) {
            // 定义变量及其标签
            const airPollutionFields = [
                { fieldName: "data_pm10", label: "PM10" },
                { fieldName: "data_pm25", label: "PM2.5" },
                { fieldName: "data_so2", label: "SO2" },
                { fieldName: "data_nox", label: "NOx" },
                { fieldName: "data_ben", label: "Benzene" },
                { fieldName: "data_no2", label: "NO2" }
            ];
        
            // 定义人口统计变量及其标签
            const socioDemographicFields = [
                { fieldName: "data_IMDDecile", label: "Index of Multiple Deprivation Decile" },
                { fieldName: "data_IncomeDecile", label: "Income Deprivation Decile" },
                { fieldName: "data_EducationDecile", label: "Education Deprivation Decile" },
                { fieldName: "data_HealthDecile", label: "Health Deprivation Decile" },
                { fieldName: "data_Asian", label: "%Asian" },
                { fieldName: "data_Black", label: "%Black" },
                { fieldName: "data_Mixed", label: "%Mixed-Race Population" },
                { fieldName: "data_White", label: "%White" },
                { fieldName: "data_Other_ethnic_group", label: "%Other Ethnic Population" },
                { fieldName: "data_color_of_people", label: "%People of Color" },
                { fieldName: "data_age_under15_", label: "%Age Under 15" },
                { fieldName: "data_age_upper65_", label: "%Age Over 65" }
            ];
        
            let content = "";
        
            // 找到变量1和变量2对应的标签
            const variable1Field = airPollutionFields.find(field => field.fieldName === variable1);
            const variable2Field = socioDemographicFields.find(field => field.fieldName === variable2);

            if (variable1Field && variable2Field) {
                const var1Value = attributes[variable1Field.fieldName] !== undefined ? attributes[variable1Field.fieldName] : "Not Available";
                const var2Value = attributes[variable2Field.fieldName] !== undefined ? attributes[variable2Field.fieldName] : "Not Available";
                console.log("Selected value12:", var1Value, var2Value);
                content += `<p>In 2021, the average annual pollution concentration of ${variable1Field.label} is ${var1Value}</p>`;
                content += `<p>The ${variable2Field.label} is ${var2Value}</p>`;
            } else {
                content = "<p>No data available for selected attributes.</p>";
            }
            console.log("content12:", content);
            return content;
        }
        function generateBivariateContent1(attributes) {
            //const selectedVariable1 = document.querySelector('input[name="variable1"]:checked');
            //const selectedVariable2 = document.querySelector('input[name="variable2"]:checked');
            const selectedVariable1 = document.querySelector('#variable1-list input:checked')?.value;
            const selectedVariable2 = document.querySelector('#variable2-list input:checked')?.value;
            console.log("Selected Variable12:", selectedVariable1, selectedVariable2);
            let content = "";
        
            if (selectedVariable1 && selectedVariable2) {
                const var1 = attributes.selectedVariable1;
                const var2 = attributes.selectedVariable2;
                console.log("v:", var1, var2);
                content="";
                content += `<p>In 2021, the average annual pollution concentration of ${selectedVariable1} is ${var1}</p>`;
                content += `<p>The ${selectedVariable2} is ${var2}</p>`;
                //content += `<p>In 2021, the average annual pollution concentration of ${fields["bivariate-map"].find(f => f.fieldName === var1)?.label || var1} is ${attributes[var1]}</p>`;
            } else {
                content = "<p>No data available for selected variables.</p>";
            }
        
            return content;
        }
        function generateBivariateContent(attributes, variable1, variable2) {
            const fields = {
                "air-pollution": [
                    { fieldName: "data_pm10", label: "PM10" },
                    { fieldName: "data_pm25", label: "PM2.5" },
                    { fieldName: "data_so2", label: "SO2" },
                    { fieldName: "data_nox", label: "NOx" },
                    { fieldName: "data_ben", label: "Benzene" },
                    { fieldName: "data_no2", label: "NO2" }
                ],
                "socio-demographic": [
                    { fieldName: "data_IMDDecile", label: "Index of Multiple Deprivation Decile" },
                    { fieldName: "data_IncomeDecile", label: "Income Deprivation Decile" },
                    { fieldName: "data_EducationDecile", label: "Education Deprivation Decile" },
                    { fieldName: "data_HealthDecile", label: "Health Deprivation Decile" },
                    { fieldName: "data_Asian", label: "%Asian" },
                    { fieldName: "data_Black", label: "%Black" },
                    { fieldName: "data_Mixed", label: "%Mixed-Race Population" },
                    { fieldName: "data_White", label: "%White" },
                    { fieldName: "data_Other_ethnic_group", label: "%Other Ethnic Population" },
                    { fieldName: "data_color_of_people", label: "%People of Color" },
                    { fieldName: "data_age_under15_", label: "%Age Under 15" },
                    { fieldName: "data_age_upper65_", label: "%Age Over 65" }
                ]
            };
        
            let content = "";

            // 从 fields 对象中获取变量1和变量2对应的字段
            const variable1Field = fields["air-pollution"].find(field => field.fieldName === variable1);
            const variable2Field = fields["socio-demographic"].find(field => field.fieldName === variable2);        
            console.log("Attributes:", variable1Field,variable2Field)
            if (variable1Field && variable2Field) {
                // 输出 attributes 对象进行调试
                console.log("Attributes:", attributes);
                console.log("Variable 1 Field Name:", variable1Field?.fieldName);
                console.log("Variable 2 Field Name:", variable2Field?.fieldName);
                // 检查属性是否存在
                const var1Value = attributes[variable1Field];
                const var2Value = attributes[variable2Field.fieldName] !== undefined ? attributes[variable2Field.fieldName] : "Not Available";
                
                console.log("Variable 1 Value:", var1Value);
                console.log("Variable 2 Value:", var2Value);
        
                content += `<p>For the selected area:</p>`;
                content += `<p>The average annual pollution concentration of ${variable1Field.label} is ${var1Value}.</p>`;
                content += `<p>The ${variable2Field.label} is ${var2Value}.</p>`;
            } else {
                console.log("One or both of the selected variables are not found in the fields object.");
            }
            console.log("Generated Bivariate Content:", content);
            return content || "<p>No data available for selected attribute.</p>";
        }
        
        function generateOtherContent(attributes, category) {
            const fields = {
                "air-pollution": [
                    { fieldName: "data_pm10", label: "PM10" },
                    { fieldName: "data_pm25", label: "PM2.5" },
                    { fieldName: "data_so2", label: "SO2" },
                    { fieldName: "data_nox", label: "NOx" },
                    { fieldName: "data_ben", label: "Benzene" },
                    { fieldName: "data_no2", label: "NO2" }
                ],
                "socio-demographic": [
                    { fieldName: "data_IMDDecile", label: "Index of Multiple Deprivation Decile" },
                    { fieldName: "data_IncomeDecile", label: "Income Deprivation Decile" },
                    { fieldName: "data_EducationDecile", label: "Education Deprivation Decile" },
                    { fieldName: "data_HealthDecile", label: "Health Deprivation Decile" },
                    { fieldName: "data_Asian", label: "%Asian" },
                    { fieldName: "data_Black", label: "%Black" },
                    { fieldName: "data_Mixed", label: "%Mixed-Race Population" },
                    { fieldName: "data_White", label: "%White" },
                    { fieldName: "data_Other_ethnic_group", label: "%Other Ethnic Population" },
                    { fieldName: "data_color_of_people", label: "%People of Color" },
                    { fieldName: "data_age_under15_", label: "%Age Under 15" },
                    { fieldName: "data_age_upper65_", label: "%Age Over 65" }
                ],
                "environmental-justice": [
                    { fieldName: "data_EJpm10", label: "PM10" },
                    { fieldName: "data_EJpm25", label: "PM2.5" },
                    { fieldName: "data_EJso2", label: "SO2" },
                    { fieldName: "data_Ejnox", label: "NOx" },
                    { fieldName: "data_Ejben", label: "Benzene" },
                    { fieldName: "data_EJno2", label: "NO2" }
                ]
            };
                let content = "";
                const categoryFields = fields[category] || [];
                console.log("Attributes:", attributes);
                categoryFields.forEach(field => {
                    if (attributes[field.fieldName] !== undefined) {
                        console.log("content12:", field.fieldName);
                        console.log("content123:", attributes[field.fieldName]);
                        if (category === "environmental-justice") {
                            content="";
                            content += `<p>In 2021, environmental justice index for ${field.label} is ${attributes[field.fieldName]}</p>`;
                        } else if (category === "air-pollution") {
                            content="";
                            content += `<p>In 2021, the average annual pollution concentration of ${field.label} is ${attributes[field.fieldName]}</p>`;
                        } else if (category === "socio-demographic") {
                            content="";
                            content += `<p>In 2021, the ${field.label} is ${attributes[field.fieldName]}</p>`;
                        }
                    }
                });
                //console.log("content123:", attributes[field.fieldName]);
            return content || "<p>No data available for selected attribute.</p>";
        }  
        function onBivariateMapSelected(feature) {
            const attributes = feature.graphic.attributes;
            const selectedVariable1 = document.querySelector('#variable1-list input:checked')?.value;
            const selectedVariable2 = document.querySelector('#variable2-list input:checked')?.value;
            const content = generateBivariatePopupContent(attributes,selectedVariable1,selectedVariable2);
            return content;
        }  
        function onOtherCategorySelected(feature) {
            const attributes = feature.graphic.attributes;
            const selectedCategory = document.querySelector('.category .toggle-btn.active');
            const category = selectedCategory ? selectedCategory.dataset.category : null;
            const content = generateOtherContent(attributes, category);
            return content;
        }
        // Main popupTemplate function
        customLayer.popupTemplate = {
            title: "Information",
            content: function(feature) {
                const selectedCategory = document.querySelector('.category .toggle-btn.active');
                const category = selectedCategory ? selectedCategory.dataset.category : null;

                if (category === "bivariate-map") {
                    return onBivariateMapSelected(feature);
                } else {
                    return onOtherCategorySelected(feature);
                }
            }
        };    
        // 配置弹出窗口
        /*customLayer.popupTemplate = {
                title: "Information",
                content: function(feature) {
                    const attributes = feature.graphic.attributes;
                    const selectedCategory = document.querySelector('.category .toggle-btn.active');
                    const category = selectedCategory ? selectedCategory.dataset.category : null;
                    //console.log("Feature attributes:", attributes);
                    //const selectedCategory = document.querySelector('.category .toggle-btn.active'); // 假设激活的按钮有 "active" 类
                    //console.log("Selected category element:", selectedCategory);
                    let content = "";
                    const fields = {
                        "air-pollution": [
                            { fieldName: "data_pm10", label: "PM10" },
                            { fieldName: "data_pm25", label: "PM2.5" },
                            { fieldName: "data_so2", label: "SO2" },
                            { fieldName: "data_nox", label: "NOx" },
                            { fieldName: "data_ben", label: "Benzene" },
                            { fieldName: "data_no2", label: "NO2" }
                        ],
                        "socio-demographic": [
                            { fieldName: "data_IMDDecile", label: "Index of Multiple Deprivation Decile" },
                            { fieldName: "data_IncomeDecile", label: "Income Deprivation Decile" },
                            { fieldName: "data_EducationDecile", label: "Education Deprivation Decile" },
                            { fieldName: "data_HealthDecile", label: "Health Deprivation Decile" },
                            { fieldName: "data_Asian", label: "%Asian" },
                            { fieldName: "data_Black", label: "%Black" },
                            { fieldName: "data_Mixed", label: "%Mixed-Race Population" },
                            { fieldName: "data_White", label: "%White" },
                            { fieldName: "data_Other_ethnic_group", label: "%Other Ethnic Population" },
                            { fieldName: "data_color_of_people", label: "%People of Color" },
                            { fieldName: "data_age_under15_", label: "%Age Under 15" },
                            { fieldName: "data_age_upper65_", label: "%Age Over 65" }
                        ],
                        "environmental-justice": [
                        { fieldName: "data_EJpm10", label: "PM10" },
                        { fieldName: "data_EJpm25", label: "PM2.5" },
                        { fieldName: "data_EJso2", label: "SO2" },
                        { fieldName: "data_Ejnox", label: "NOx" },
                        { fieldName: "data_Ejben", label: "Benzene" },
                        { fieldName: "data_EJno2", label: "NO2" }
                        ],
                        "bivariate-map": [
                            { fieldName: "data_pm10", label: "PM10" },
                            { fieldName: "data_pm25", label: "PM2.5" },
                            { fieldName: "data_so2", label: "SO2" },
                            { fieldName: "data_nox", label: "NOx" },
                            { fieldName: "data_ben", label: "Benzene" },
                            { fieldName: "data_no2", label: "NO2" },
                            { fieldName: "data_IMDDecile", label: "Index of Multiple Deprivation Decile" },
                            { fieldName: "data_IncomeDecile", label: "Income Deprivation Decile" },
                            { fieldName: "data_EducationDecile", label: "Education Deprivation Decile" },
                            { fieldName: "data_HealthDecile", label: "Health Deprivation Decile" },
                            { fieldName: "data_Asian", label: "%Asian" },
                            { fieldName: "data_Black", label: "%Black" },
                            { fieldName: "data_Mixed", label: "%Mixed-Race Population" },
                            { fieldName: "data_White", label: "%White" },
                            { fieldName: "data_Other_ethnic_group", label: "%Other Ethnic Population" },
                            { fieldName: "data_color_of_people", label: "%People of Color" },
                            { fieldName: "data_age_under15_", label: "%Age Under 15" },
                            { fieldName: "data_age_upper65_", label: "%Age Over 65" }
                        ]
                    };
                    const categoryFields = fields[currentCategory] || [];
                    //categoryFields.forEach(field => {
                        const selectedVariable1 = document.querySelector('input[name="variable1"]:checked');
                        const selectedVariable2 = document.querySelector('input[name="variable2"]:checked');

                        if (category === "bivariate-map" && selectedVariable1 && selectedVariable2) {
                            const var1 = selectedVariable1.value;
                            const var2 = selectedVariable2.value;
                            // 打印调试信息
                            console.log("Selected Variable 1:", var1);
                            console.log("Selected Variable 2:", var2);
                            console.log("Fields for bivariate-map:", fields["bivariate-map"]);

                            console.log("Var1 label:", fields["bivariate-map"].find(f => f.fieldName === var1)?.label);
                            console.log("Var2 label:", fields["bivariate-map"].find(f => f.fieldName === var2)?.label);

                            content ="";
                            content += `<p>In 2021, the average annual pollution concentration of ${fields["bivariate-map"].find(f => f.fieldName === var1)?.label || var1} is ${attributes[var1]}</p>`;
                            //content += `<p>The ${fields["bivariate-map"].find(f => f.fieldName === var2)?.label || var2} is ${attributes[var2]}</p>`;
                        } else {
                            categoryFields.forEach(field => {
                                if (attributes[field.fieldName] !== undefined) {
                                    if (category === "environmental-justice") {
                                        content ="";
                                        content += `<p>In 2021, environmental justice index for ${field.label} is ${attributes[field.fieldName]}</p>`;
                                    } else {
                                        if(category === "air-pollution"){
                                            content ="";
                                            content += `<p>In 2021, the average annual pollution concentration of ${field.label} is ${attributes[field.fieldName]}</p>`;
                                        }
                                        else{
                                            if(category ==="socio-demographic"){
                                            content ="";
                                            content += `<p>In 2021, the ${field.label} is ${attributes[field.fieldName]}</p>`;

                                            }
                                        }
                                    }    
                                }
                            });
                        }

                    //});
                    return content || "<p>No data available for selected attribute.</p>"; 
                }
               
        };*/
        /*
        // Function to clear all selections in the specified category
        // Function to clear all selections in the specified category
        function clearSelections(category) {
            const attributesDiv = document.getElementById(`${category}-attributes`);
            if (attributesDiv) {
                const selectedRadio = attributesDiv.querySelector('input[type="radio"]:checked');
                if (selectedRadio) {
                    selectedRadio.checked = false;
                }
            }
        }
        // Function to handle bivariate selection changes
        function handleBivariateSelection() {
            const bivariateAttributes = document.querySelectorAll('#bivariate-map-attributes input[type="radio"]');
            bivariateAttributes.forEach(attr => {
                attr.addEventListener('change', () => {
                    // Clear single-variable selections
                    clearSelections('air-pollution');
                    clearSelections('socio-demographic');
                    clearSelections('environmental-justice');

                    // Get selected variables
                    const selectedVariable1 = document.querySelector('input[name="variable1"]:checked')?.value;
                    const selectedVariable2 = document.querySelector('input[name="variable2"]:checked')?.value;

                    // Render bivariate layer if both variables are selected
                    if (selectedVariable1 && selectedVariable2) {
                        renderBivariateLayer(selectedVariable1, selectedVariable2);
                    }
                });
            });
        }

        // Function to handle single-variable selection changes
        function handleSingleVariableSelection() {
            const radioButtons = document.querySelectorAll('#air-pollution-attributes input[type="radio"], #socio-demographic-attributes input[type="radio"], #environmental-justice-attributes input[type="radio"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    const attribute = radio.value;

                    if (attribute) {
                        updateRenderer(attribute);
                        
                        // Simulate a click on map features to trigger a popup
                        view.whenLayerView(customLayer).then(function(layerView) {
                            // Perform a query
                            layerView.queryFeatures({
                                geometry: view.extent,  // Or use another geometry for querying
                                returnGeometry: true,
                                outFields: ["*"]  // Return all fields
                            }).then(function(results) {
                                console.log("Query results:", results.features); // Confirm query results
                                if (results.features.length > 0) {
                                    const graphic = results.features[0];
                                    view.popup.clear();
                                    view.popup.open({
                                        title: graphic.attributes.name || "Attribute Information",
                                        content: customLayer.popupTemplate.content({ graphic }),
                                        location: graphic.geometry
                                    });
                                } else {
                                    console.log("No features found in the query."); // No features found
                                }
                            }).catch(function(error) {
                                console.error("Query error:", error); // Log query error
                            });
                        });
                    }
                });
            });
        }*/
/*
        // Function to handle selection of single-variable options
        function handleSingleVariableSelection() {
            const categories = ['air-pollution', 'socio-demographic', 'environmental-justice'];
            
            // Listen for changes in single-variable radio buttons
            categories.forEach(category => {
                const attributesDiv = document.getElementById(`${category}-attributes`);
                if (attributesDiv) {
                    attributesDiv.addEventListener('change', (event) => {
                        if (event.target.type === 'radio') {
                            updateRenderer(event.target.value);
                            
                            // Clear bivariate selections
                            clearSelections('bivariate-map');
                        }
                    });
                }
            });
        }

        // Function to handle selection of bivariate options
        function handleBivariateSelection() {
            const bivariateDiv = document.getElementById('bivariate-map-attributes');
            if (bivariateDiv) {
                bivariateDiv.addEventListener('change', (event) => {
                    if (event.target.type === 'radio') {
                        const variable1 = document.querySelector('input[name="variable1"]:checked');
                        const variable2 = document.querySelector('input[name="variable2"]:checked');
                        
                        if (variable1 && variable2) {
                            const selectedVariable1 = variable1.value;
                            const selectedVariable2 = variable2.value;
                            
                            renderBivariateLayer(selectedVariable1, selectedVariable2);
                            
                            // Clear single-variable selections
                            clearSelections('air-pollution');
                            clearSelections('socio-demographic');
                            clearSelections('environmental-justice');
                        }
                    }
                });
            }
        }

        // Initialize event listeners
        document.addEventListener('DOMContentLoaded', () => {
            handleSingleVariableSelection();
            handleBivariateSelection();
        });

        // Function to update renderer (for illustration purposes)
        function updateRenderer(attribute) {
            console.log(`Updating renderer with attribute: ${attribute}`);
            // Implementation for updating renderer based on selected attribute
        }

        // Function to render bivariate layer (for illustration purposes)
        function renderBivariateLayer(variable1, variable2) {
            console.log(`Rendering bivariate layer with variables: ${variable1} and ${variable2}`);
            // Implementation for rendering bivariate layer based on selected variables
        }
*/
        // 设置点击事件以显示弹出窗口
        /*view.on("click", function(event) {
            view.hitTest(event).then(function(response) {
                const result = response.results.filter(function(result) {
                    return result.graphic.layer === featureLayer;
                })[0];

                if (result) {
                    view.popup.open({
                        title: result.graphic.attributes.name || "Attribute Information",
                        content: featureLayer.popupTemplate.content(result),
                        location: event.mapPoint
                    });
                }
            });
        });
*/
        // 监听双变量选择
       /*const bivariateAttributes = document.querySelectorAll('#bivariate-map-attributes input[type="radio"]');
        bivariateAttributes.forEach(attr => {
            attr.addEventListener('change', () => {
                // 清除单变量选择状态
                const singleVariableSections = document.querySelectorAll('.category .toggle-btn.active');
                singleVariableSections.forEach(section => {
                    section.classList.remove('active'); // 根据你的样式处理重置
                    const radios = section.querySelectorAll('input[type="radio"]');
                    radios.forEach(radio => {
                        radio.checked = false;
                    });
                });
                const selectedVariable1 = document.querySelector('#variable1-list input:checked')?.value;
                const selectedVariable2 = document.querySelector('#variable2-list input:checked')?.value;                
                //const selectedVariable1 = document.querySelector('input[name="variable1"]:checked')?.value;
                //const selectedVariable2 = document.querySelector('input[name="variable2"]:checked')?.value;
                console.log("Selected Variables:", selectedVariable1, selectedVariable2);
                //const value1=selectedVariable1.value;
                //const value2=selectedVariable2.value;
                //console.log("Selected value:", value1, value2);
                if (selectedVariable1 && selectedVariable2) {
                    renderBivariateLayer(selectedVariable1, selectedVariable2);
                    console.log("Selected Variable 1:", selectedVariable1);
                    console.log("Selected Variable 2:", selectedVariable2);
                    // 当双变量被选择后，查询当前视图中的要素并打开弹窗
                    view.whenLayerView(customLayer).then(function(layerView) {
                        // 执行查询，获取当前视图范围内的要素
                        layerView.queryFeatures({
                            geometry: view.extent,  // 使用当前视图范围
                            returnGeometry: true,
                            outFields: ["*"]  // 返回所有字段
                        }).then(function(results) {
                            console.log("Query results:", results);
                            if (results.features.length > 0) {
                                const graphic = results.features[0];

                                // 获取要素的属性数据
                                const attributes = graphic.attributes;
                                console.log("Attributes Object:", attributes);

                                // 获取选中的变量值
                                const selectedVariable1 = document.querySelector('input[name="variable1"]:checked').value;
                                const selectedVariable2 = document.querySelector('input[name="variable2"]:checked').value;
                                console.log("selectContent:", selectedVariable1,selectedVariable2);
                                // 生成弹窗内容
                                const contentpopup = generateBivariateContent(
                                    graphic,
                                    selectedVariable1,
                                    selectedVariable2
                                );
                                // 打开弹窗并打印生成的内容进行调试
                                console.log("Popup Content:", contentpopup);
                                let location = graphic.geometry;

                                    if (location.type !== "point") {
                                        // 如果 location 不是点类型，将多边形的中心点用作弹窗的位置
                                        location = location.extent.center; 
                                    }
                                const content = generateBivariateContent1(attributes);
                                //console.log("Found feature:", graphic); 
                                if (graphic && graphic.attributes) {
                                    // 使用 onBivariateMapSelected 函数生成弹窗内容
                                    //const content = generateBivariateContent(graphic);
        
                                    // 清除之前的弹窗
                                    view.closePopup();
        
                                    // 打开新的弹窗
                                    view.openPopup({
                                        title: graphic.attributes.name || "Information",
                                        content: content,  // 使用 onBivariateMapSelected 生成的内容
                                        location: location
                                    });
                                } else {
                                    console.error("Graphic or graphic.attributes is undefined.");
                                }
                                // 使用 onOtherCategorySelected 函数生成弹窗内容
                                /*const content = onBivariateMapSelected(graphic);

                                // 清除之前的弹窗
                                view.popup.close();

                                // 打开新的弹窗
                                view.popup.open({
                                    title: graphic.attributes.name || "Information",
                                    content: content,  // 使用 onOtherCategorySelected 生成的内容
                                    location: graphic.geometry
                                });
                            } else {
                                console.log("No features found in the query."); // 如果没有找到要素
                            }
                        })
                    });
                    /* 获取当前图层中的要素（假设你有某种方式获取选中或当前显示的要素）
                    const currentFeatures = customLayer.source.graphics.items; // 根据你的图层结构获取要素

                    // 遍历要素，生成并显示弹窗
                    currentFeatures.forEach(feature => {
                        const content = onBivariateMapSelected(feature);
                        // 假设你有一个 showPopup 函数来显示弹窗
                        //showPopup(feature.geometry, content);
                        const popup = customLayer.popupTemplate; // 获取当前图层的弹窗模板
                        popup.content = content; // 设置弹窗内容
                        view.popup.open({
                            location: feature.geometry, // 设置弹窗位置
                            content: content
                        }); // `feature.geometry`是弹窗的位置
                    });*/
                    /*view.whenLayerView(customLayer).then(function(layerView) {
                        // 执行查询
                        layerView.queryFeatures({
                            geometry: view.extent,  // 或者其他用于查询的几何体
                            returnGeometry: true,
                            outFields: ["*"]  // 返回所有字段
                        }).then(function(results) {
                            console.log("Query results:", results);
                            if (results.features.length > 0) {
                                const graphic = results.features[0];
                                console.log("Found feature:", graphic);
                                view.popup.close();
                                let location = graphic.geometry;
                                if (location.type !== "point") {
                                    // 将多边形转换为中心点
                                    location = location.extent.center;
                                }
                                view.popup.open({
                                    title: graphic.attributes.name || "Information",
                                    content: customLayer.popupTemplate.content({ graphic }),
                                    location: location
                                });
                            } else {
                                console.log("No features found in the query."); // 如果没有找到要素
                            }
                        }).catch(function(error) {
                            console.error("Query error:", error); // 打印查询错误
                        });
                    });
                }
            });
        });*/
        const bivariateRadioButtons = document.querySelectorAll(
            '#bivariate-map-attributes input[type="radio"]'
        );
        
        // 用于存储已选择的变量
        let selectedVariable1 = null;
        let selectedVariable2 = null;
        
        // 添加事件监听器到每个单选按钮
        bivariateRadioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                const attribute = radio.value;
                radioButtons.forEach(singleRadio => {
                    singleRadio.checked = false;
                });
                // 根据所选择的单选按钮的 name 属性来确定是变量1还是变量2
                if (radio.name === 'variable1') {
                    selectedVariable1 = attribute;
                } else if (radio.name === 'variable2') {
                    selectedVariable2 = attribute;
                }
                // 检查是否两个变量都已选择
                if (selectedVariable1 && selectedVariable2) {
                    // 调用更新内容的函数
                    renderBivariateLayer(selectedVariable1, selectedVariable2);
                    console.log("Selected Variables:", selectedVariable1, selectedVariable2);
                    view.closePopup();
                }
            });
        });
       // 监听单选按钮选择
        //const radioButtons = document.querySelectorAll('#bivariate-map-attributes input[type="radio"][name="variable"]');
        const radioButtons = document.querySelectorAll(
            '#air-pollution-attributes input[type="radio"], ' +
            '#socio-demographic-attributes input[type="radio"], ' +
            '#environmental-justice-attributes input[type="radio"]'
        );
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                const attribute = radio.value;
                if (attribute) {
                    // 清空双选按钮的选择
                    bivariateRadioButtons.forEach(bivariateRadio => {
                        bivariateRadio.checked = false;
                    })
                }
                if (attribute) {
                    
                    updateRenderer(attribute);
                     // 在这里添加获取要素和显示弹窗的代码
                     view.whenLayerView(customLayer).then(function(layerView) {
                        // 执行查询，获取当前视图范围内的要素
                        layerView.queryFeatures({
                            geometry: view.extent,  // 使用当前视图范围
                            returnGeometry: true,
                            outFields: ["*"]  // 返回所有字段
                        }).then(function(results) {
                            if (results.features.length > 0) {
                                const graphic = results.features[0];

                                if (graphic && graphic.attributes) { // 确保 graphic 和 graphic.attributes 存在
                                    // 使用 onOtherCategorySelected 函数生成弹窗内容
                                    const content = generateOtherContent(graphic);
                                    let location = graphic.geometry;

                                    if (location.type !== "point") {
                                        // 如果 location 不是点类型，将多边形的中心点用作弹窗的位置
                                        location = location.extent.center; 
                                    }
                                    // 清除之前的弹窗
                                    view.closePopup();
                                    view.on("click", function(event) {
                                        view.hitTest(event).then(function(response) {
                                            const clickedGraphic = response.results.filter(function (result) {
                                                return result.graphic.layer === customLayer;
                                            })[0].graphic;
                    
                                            if (clickedGraphic && clickedGraphic.attributes) {
                                                // 在用户点击要素时打开弹窗
                                                view.openPopup({
                                                    title: clickedGraphic.attributes.name || "Information",
                                                    content: content,  // 使用 generateBivariatePopupContent 生成的内容
                                                    location: location
                                                });
                                            }
                                        });
                                    });
                                } else {
                                    console.error("Graphic or graphic.attributes is undefined.");
                                }
                            } else {
                                console.log("No features found in the query."); // 如果没有找到要素
                            }
                        })
                    });
                                      
                    // 获取当前图层中的要素（假设你有某种方式获取选中或当前显示的要素）
                    /*const currentFeatures = customLayer.source.graphics.items; // 根据你的图层结构获取要素

                    // 遍历要素，生成并显示弹窗
                    currentFeatures.forEach(feature => {
                        const selectedCategory = document.querySelector('.category .toggle-btn.active');
                        //const category = selectedCategory ? selectedCategory.dataset.category : null;
                        
                        // 调用其他类别的弹窗生成函数
                        const content = onOtherCategorySelected(feature);
                        
                        // 假设你有一个 showPopup 函数来显示弹窗
                        //showPopup(feature.geometry, content);
                        const popup = customLayer.popupTemplate; // 获取当前图层的弹窗模板
                        popup.content = content; // 设置弹窗内容
                        view.popup.open({
                            location: feature.geometry, // 设置弹窗位置
                            content: content
                        }); // `feature.geometry`是弹窗的位置
                    });*/
                    // 模拟点击地图要素以触发弹出窗口
                    /*view.whenLayerView(customLayer).then(function(layerView) {
                        // 执行查询
                        layerView.queryFeatures({
                            geometry: view.extent,  // 或者其他用于查询的几何体
                            returnGeometry: true,
                            outFields: ["*"]  // 返回所有字段
                        }).then(function(results) {
                            
                            if (results.features.length > 0) {
                                const graphic = results.features[0];
                                view.popup.clear();
                                view.popup.open({
                                    title: graphic.attributes.name || "Information",
                                    content: customLayer.popupTemplate.content({ graphic }),
                                    location: graphic.geometry
                                });
                            } else {
                                console.log("No features found in the query."); // 如果没有找到要素
                            }
                        }).catch(function(error) {
                            console.error("Query error:", error); // 打印查询错误
                        });
                    });*/
                
                }
            });
        
        });


    });

