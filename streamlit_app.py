import streamlit as st
import pandas as pd
import numpy as np
import altair as alt
import ast


st.title("Interactive Tag Analysis for NEU Colleges")

# Upload CSV file
uploaded_file = st.file_uploader("Upload your CSV file", type="csv")
if uploaded_file:
    # Load your data
    data = pd.read_csv(uploaded_file)

    # Parse Popular Tags and ensure it's a list
    data['Popular Tags'] = data['Popular Tags'].apply(ast.literal_eval)

    # Explode Popular Tags for detailed analysis
    exploded_tags = data.explode('Popular Tags')[['Popular Tags', 'Department', 'NEU_Colleges', 'Average Rating (Out of 5)', 'Reviews']]

    # Aggregate tag frequencies
    tag_counts = exploded_tags.groupby(['Popular Tags', 'NEU_Colleges', 'Department']).size().reset_index(name='Count')

    # Dropdown filter for colleges
    colleges = tag_counts['NEU_Colleges'].unique()
    selected_college = st.selectbox("Select College:", options=colleges)

    # Filter data based on selected college
    filtered_tag_counts = tag_counts[tag_counts['NEU_Colleges'] == selected_college]

    # Create a bar chart for Popular Tags with color based on Colleges
    tag_chart = alt.Chart(filtered_tag_counts).mark_bar().encode(
        x=alt.X('Count:Q', title='Tag Frequency'),
        y=alt.Y('Popular Tags:N', sort='-x', title='Popular Tags'),
        color=alt.Color('Department:N', legend=alt.Legend(title="Department")),
        tooltip=['Popular Tags', 'Count', 'NEU_Colleges', 'Department']
    ).properties(
        width=800,
        height=500,
        title=f'Tag Frequency for {selected_college}'
    )

    # Truncate long comments for display
    exploded_tags['Comments'] = exploded_tags['Reviews'].apply(lambda r: str(r)[:100])

    # Filter exploded_tags based on selected college
    filtered_exploded_tags = exploded_tags[exploded_tags['NEU_Colleges'] == selected_college]

    # Add comments chart
    comments_chart = alt.Chart(filtered_exploded_tags).mark_text().encode(
        text='Comments:N',
        tooltip=['Popular Tags', 'Department', 'Average Rating (Out of 5)', 'Comments']
    ).properties(
        width=800,
        height=150,
        title=f'Comments for {selected_college}'
    )

    # Display the charts in Streamlit
    st.altair_chart(tag_chart, use_container_width=True)
    st.altair_chart(comments_chart, use_container_width=True)


    columns_to_explore = [
    'Department',
    'NEU_Colleges',
    'Average Rating (Out of 5)',
    'Number of Ratings',
    'Would Take Again (Percent)',
    'Level of Difficulty (Out of 5)'
]

    # Melt the data to make it compatible with Altair's interactivity
    melted_data = data.melt(
        id_vars=['Department', 'NEU_Colleges'],
        value_vars=columns_to_explore[2:],
        var_name='Metric',
        value_name='Value'
    )

    # Create dropdown menus for college and metrics
    college_dropdown = alt.binding_select(options=list(melted_data['NEU_Colleges'].dropna().unique()), name='Select College: ')
    college_selection = alt.selection_single(fields=['NEU_Colleges'], bind=college_dropdown)

    metric_dropdown = alt.binding_select(options=list(melted_data['Metric'].dropna().unique()), name='Select Metric: ')
    metric_selection = alt.selection_single(fields=['Metric'], bind=metric_dropdown)

    # Build the heatmap
    heatmap = (
        alt.Chart(melted_data)
        .mark_rect()
        .encode(
            x=alt.X('Department:N', title='Department', sort='-y'),
            y=alt.Y('NEU_Colleges:N', title='College'),
            color=alt.Color('Value:Q', title='Metric Value', scale=alt.Scale(scheme='plasma', domain=[0, 5])),
            tooltip=[
                alt.Tooltip('Department', title='Department'),
                alt.Tooltip('NEU_Colleges', title='College'),
                alt.Tooltip('Metric', title='Metric'),
                alt.Tooltip('Value', title='Value', format=".2f")
            ]
        )
        .add_selection(college_selection)
        .transform_filter(college_selection)
        .add_selection(metric_selection)
        .transform_filter(metric_selection)
        .properties(
            title={
                "text": ["Heatmap: Insights on Northeastern Ratings"],
                "subtitle": ["Visualizing department-level metrics across colleges."],
                "fontSize": 20,
                "subtitleFontSize": 15,
                "color": "darkblue",
                "subtitleColor": "gray",
                "anchor": "start"
            },
            width=900,
            height=600
        )
    )

    # Add additional styling
    styled_heatmap = heatmap.configure_title(
        fontSize=22,
        anchor='start',
        color='darkblue'
    ).configure_axis(
        labelFontSize=12,
        titleFontSize=16,
        labelAngle=45,
        titleColor='darkblue'
    ).configure_legend(
        titleFontSize=16,
        labelFontSize=14,
        gradientLength=300,
        gradientThickness=20,
        titleColor='darkblue'
    ).configure_view(
        strokeWidth=0
    )

    st.altair_chart(styled_heatmap, use_container_width=True)

    

else:
    st.write("Please upload a CSV file to get started.")