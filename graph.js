const fs = require('fs');
const { createCanvas } = require('canvas');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables); 
const DEFAULT_BRANCH = 'main';
const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
    '#393b79', '#f6e7e7', '#4C90F7', '#7BE141', '#ED1C24',
    '#8D208B', '#FF6600', '#A67D3D', '#BEF202', '#00A651',
    '#C50048', '#F9A3AA', '#9B9B9B', '#D6CADD', '#BCD2EE',
    '#FFC001', '#A4E321', '#0080C3', '#F06A00', '#8A8A8A',
    '#C9DB92', '#B2E2F5', '#F5B800', '#7CD1EF', '#FF6C60',
    '#606060', '#E6EBD9', '#D3DFB8', '#2A9FD6', '#FFABAB'
];

function create_branch_graph(logs,ctx, points, branch, idx, branches){
    // Crear un lienzo
    let height = 29.5*logs.length;
    const main_canvas = createCanvas(60*branches.length, height);//para dos 55, para 3 es 84
    const main_ctx = main_canvas.getContext('2d');

    let point_radius = [];
    logs.forEach((log, index) => {
        if(log.branch == branch){
            point_radius.push(colors[idx]);
        }else{
            point_radius.push('rgba(0, 0, 0, 0)');
        }
    });
    
    let last_position = get_last_position(branches[idx],logs);
    let x_point = [];
    let band = false;
    let border_style = []
    logs.forEach((log, index) => {
        if(log.branch != branch && !band){
            border_style.push(NaN)
        }else{
            band=true;
            border_style.push(0)
        }
        if (branches[idx] === DEFAULT_BRANCH){
            x_point.push(0);
        }else {
            if(index <= last_position){
                x_point.push(branches.length-idx-1);
                if(index+1 < logs.length){
                    if('branch_created' in log){
                        if(branch == log.branch && log.branch != logs[index+1].branch){
                            let id = branches.findIndex((branch) => branch == log.branch_created);
                            x_point[index+1] = branches.length-id-1;
                        }
                    }else if('branch_merge' in log){
                        if(branch == log.branch_merge){
                            let id = branches.findIndex((branch) => branch == log.branch_merge);
                            x_point[index] = id-1;
                            border_style.push(0)
                            border_style.push(0)
                        }
                    }
                }

            }
        }

    });
    // Configurar el gráfico
    const chartConfig = {
        type: 'line', // Cambiar el tipo de gráfico a 'line'
        data: {
            labels: points,
            datasets: [{
                data: x_point,
                backgroundColor: 'rgba(75, 192, 192, 0)',
                borderColor: colors[idx],
                borderWidth: 4,
                pointBackgroundColor: point_radius, // Color de fondo de los puntos
                pointBorderColor: point_radius, // Color del borde de los puntos
                pointRadius: 5, // Radio de los puntos
            }]
        },
        options: {
            indexAxis: 'y', 
            scales: {
                x: {
                    beginAtZero: true,
                    display: false,
                    min: -0.5,
                    max: branches.length,
                    ticks: {
                        stepSize: 1 
                    }
                },
                y: {
                    display: false,
                    position: "right",
                }
            },
            plugins: {
                legend: {
                  display: false
                }
            }
        }
    };

    // Crear el gráfico
    new Chart(main_ctx, chartConfig);
    ctx.drawImage(main_canvas, 0, 0);
}

function print_labels(logs, labels, ctx, branches){
    labels.forEach((log,idx) => {
        ctx.fillStyle = colors[branches.indexOf(logs[idx].branch)];
        ctx.fillText(log, 50*branches.length, 16+(30*idx));//150
    });
}

function get_last_position(branch, datos) {
    // Inicializar la variable para almacenar la última posición
    let ultimaPosicion = -1;

    // Iterar sobre el array de objetos
    for (let i = 0; i < datos.length; i++) {
        // Verificar si el branch actual coincide con el branch buscado
        if (datos[i].branch === branch) {
            ultimaPosicion = i; // Actualizar la última posición encontrada
        }
    }

    // Devolver la última posición encontrada
    return ultimaPosicion;
}
function get_count_views_branch(logs, branch) {
    return logs.reduce((contador, elemento) => {
        if (elemento.branch === branch) {
            contador++;
        }
        return contador;
    }, 0);
}

// Función para generar el gráfico
function generate_graph(logs, branches) {
    let logs_label = [];
    let points = [];
    logs.forEach(log => {
        if(log.message.includes("["+log.branch+"] "+"Created")){
            logs_label.push(log.message+" from ["+log.branch_created + "] branch")
        }else{
            logs_label.push("["+log.branch+"]"+" ["+log.author_name+"] - "+log.message)
        }
        points.push(0);
    });    
    
    // Crear un lienzo
    const canvas = createCanvas(800, 30*logs.length);
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ///////////////////////////////////////////////////////////////////////////
    
    branches.forEach((branch, idx) => {
        create_branch_graph(logs,ctx, points, branch, idx, branches);
    });
    


    ///////////////////////////////////////////////////////////////////
    print_labels(logs, logs_label, ctx, branches)


    // Guardar el gráfico como un archivo PNG
    try {
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('git_grapher.png', buffer);
        console.log('-> Successfully generated graph!!!');
    } catch (error) {
        console.log("-> There is no commit yet.")
    }
}
module.exports = {
    generate_graph,
    get_last_position
};